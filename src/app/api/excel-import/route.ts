import { NextRequest, NextResponse } from 'next/server';
import type { ExcelImportResult, ExcelImportError, ExcelImportValidation } from '@/types/ontology';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const EXPECTED_SHEETS = ['实体', '属性', '关系', '状态机', '规则', '事件'];
const SHEET_HEADER_MAP: Record<string, Record<number, { key: string; required: boolean; type: 'string' | 'number' | 'boolean' | 'enum'; enumValues?: string[] }>> = {
  '实体': {
    0: { key: 'name', required: true, type: 'string' },
    1: { key: 'nameEn', required: true, type: 'string' },
    2: { key: 'entityRole', required: false, type: 'enum', enumValues: ['aggregate_root', 'child_entity'] },
    3: { key: 'parentAggregateId', required: false, type: 'string' },
    4: { key: 'projectName', required: false, type: 'string' },
    5: { key: 'businessScenarioName', required: false, type: 'string' },
    6: { key: 'description', required: false, type: 'string' },
    7: { key: 'businessMeaning', required: false, type: 'string' },
    8: { key: 'aliases', required: false, type: 'string' },
  },
  '属性': {
    0: { key: 'entityNameEn', required: true, type: 'string' },
    1: { key: 'name', required: true, type: 'string' },
    2: { key: 'nameEn', required: true, type: 'string' },
    3: { key: 'dataType', required: true, type: 'enum', enumValues: ['string', 'text', 'integer', 'decimal', 'boolean', 'date', 'datetime', 'enum', 'reference'] },
    4: { key: 'required', required: false, type: 'boolean' },
    5: { key: 'unique', required: false, type: 'boolean' },
  },
  '关系': {
    0: { key: 'sourceEntityNameEn', required: true, type: 'string' },
    1: { key: 'name', required: true, type: 'string' },
    2: { key: 'type', required: true, type: 'enum', enumValues: ['one_to_one', 'one_to_many', 'many_to_many'] },
    3: { key: 'targetEntityNameEn', required: true, type: 'string' },
  },
  '状态机': {
    0: { key: 'entityNameEn', required: true, type: 'string' },
    1: { key: 'name', required: true, type: 'string' },
    2: { key: 'statusField', required: false, type: 'string' },
    3: { key: 'stateName', required: true, type: 'string' },
  },
  '规则': {
    0: { key: 'entityNameEn', required: true, type: 'string' },
    1: { key: 'name', required: true, type: 'string' },
    2: { key: 'type', required: true, type: 'enum', enumValues: ['field_validation', 'cross_field_validation', 'cross_entity_validation', 'aggregation_validation', 'temporal_rule'] },
    7: { key: 'errorMessage', required: true, type: 'string' },
  },
  '事件': {
    0: { key: 'entityNameEn', required: true, type: 'string' },
    1: { key: 'name', required: true, type: 'string' },
    3: { key: 'trigger', required: true, type: 'enum', enumValues: ['create', 'update', 'delete', 'state_change', 'custom'] },
  },
};

export async function POST(request: NextRequest) {
  const XLSX = await import('xlsx');
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, errorMessage: '未上传文件' } as ExcelImportResult, { status: 400 });
    }

    if (!file.name.endsWith('.xlsx')) {
      return NextResponse.json({ success: false, errorMessage: '仅支持 .xlsx 格式文件' } as ExcelImportResult, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, errorMessage: `文件大小超过5MB限制(当前${(file.size / 1024 / 1024).toFixed(1)}MB)` } as ExcelImportResult, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: 'buffer' });

    // Sheet 结构校验
    const sheetNames = wb.SheetNames.filter(n => n !== '填写说明');
    const missingSheets = EXPECTED_SHEETS.filter(s => !sheetNames.includes(s));
    if (missingSheets.length > 0) {
      return NextResponse.json({
        success: false,
        errorMessage: `缺少必需的Sheet: ${missingSheets.join(', ')}`,
        validation: { totalRows: 0, validRows: 0, errorCount: 0, errors: [] },
      } as ExcelImportResult, { status: 400 });
    }

    // 逐 Sheet 逐行校验
    const allErrors: ExcelImportError[] = [];
    let totalRows = 0;
    const entityNameEns = new Set<string>();

    // 第一遍: 收集实体名
    const entitySheet = wb.Sheets['实体'];
    if (entitySheet) {
      const entityData = XLSX.utils.sheet_to_json<Record<string, string>>(entitySheet, { defval: '' });
      for (const row of entityData) {
        const nameEn = row['英文名称(必填)'] || '';
        if (nameEn) entityNameEns.add(nameEn.trim());
      }
    }

    // 第二遍: 校验每个 Sheet
    for (const sheetName of EXPECTED_SHEETS) {
      const ws = wb.Sheets[sheetName];
      if (!ws) continue;

      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
      const colMap = SHEET_HEADER_MAP[sheetName] || {};
      const allRows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
      const headers = allRows[0] as string[];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        // 跳过描述行(以 #DESC# 开头的值)和示例行(以 #EXAMPLE# 开头)
        const firstVal = Object.values(row)[0] || '';
        const firstStr = firstVal.toString();
        if (firstStr.startsWith('#DESC#') || firstStr.startsWith('#EXAMPLE#')) continue;

        totalRows++;

        for (const [colIdx, spec] of Object.entries(colMap)) {
          const colLabel = headers[Number(colIdx)];
          const value = (row[colLabel] || '').toString().trim();

          if (spec.required && !value) {
            allErrors.push({
              sheet: sheetName,
              row: i + 2,
              column: colLabel,
              value: '',
              errorType: 'missing_required',
              message: `第${i + 2}行: ${colLabel} 为必填字段`,
            });
            continue;
          }

          if (!value) continue;

          if (spec.type === 'enum' && spec.enumValues && !spec.enumValues.includes(value)) {
            allErrors.push({
              sheet: sheetName,
              row: i + 2,
              column: colLabel,
              value,
              errorType: 'invalid_enum',
              message: `第${i + 2}行: ${colLabel} 值"${value}"不在允许范围[${spec.enumValues.join('/')}]内`,
            });
          }

          if (spec.type === 'boolean' && !['true', 'false', ''].includes(value.toLowerCase())) {
            allErrors.push({
              sheet: sheetName,
              row: i + 2,
              column: colLabel,
              value,
              errorType: 'invalid_type',
              message: `第${i + 2}行: ${colLabel} 必须为 true 或 false`,
            });
          }
        }

        // 跨Sheet引用校验: 非实体Sheet中引用的 entityNameEn 必须在实体Sheet中存在
        if (sheetName !== '实体') {
          const entityNameEnCol = Object.entries(colMap).find(([, s]) => s.key === 'entityNameEn')?.[0];
          if (entityNameEnCol) {
            const colLabel = headers[Number(entityNameEnCol)];
            const refName = (row[colLabel] || '').toString().trim();
            if (refName && !entityNameEns.has(refName)) {
              allErrors.push({
                sheet: sheetName,
                row: i + 2,
                column: colLabel,
                value: refName,
                errorType: 'invalid_reference',
                message: `第${i + 2}行: 实体"${refName}"在实体Sheet中不存在`,
              });
            }
          }
        }
      }
    }

    const validation: ExcelImportValidation = {
      totalRows,
      validRows: totalRows - new Set(allErrors.map(e => `${e.sheet}:${e.row}`)).size,
      errorCount: allErrors.length,
      errors: allErrors,
    };

    if (allErrors.length > 0) {
      return NextResponse.json({
        success: false,
        errorMessage: `校验发现${allErrors.length}个错误`,
        validation,
      } as ExcelImportResult, { status: 200 });
    }

    // 解析成功 - 生成版本ID
    const versionId = `v-${Date.now()}`;
    const versionName = `v${new Date().toISOString().slice(0, 10)}`;

    return NextResponse.json({
      success: true,
      validation,
      versionId,
      versionName,
    } as ExcelImportResult, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({
      success: false,
      errorMessage: `导入失败: ${message}`,
      validation: { totalRows: 0, validRows: 0, errorCount: 0, errors: [] },
    } as ExcelImportResult, { status: 500 });
  }
}
