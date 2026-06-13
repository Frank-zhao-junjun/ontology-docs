from datetime import datetime, timezone
from sqlalchemy import UniqueConstraint
from .extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class Domain(db.Model):
    __tablename__ = "domain"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False, unique=True)
    description = db.Column(db.String(512), nullable=True)
    tags = db.Column(db.String(256), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)


class MetaModelDefinition(db.Model):
    __tablename__ = "meta_model_definition"

    id = db.Column(db.Integer, primary_key=True)
    model_type = db.Column(db.String(64), nullable=False)
    name = db.Column(db.String(128), nullable=False)
    version = db.Column(db.String(32), nullable=False)
    content_json = db.Column(db.JSON, nullable=False)
    status = db.Column(db.String(32), nullable=False, default="draft")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    __table_args__ = (
        UniqueConstraint("model_type", "name", "version", name="uq_meta_model_version"),
    )


class MetaModelRelease(db.Model):
    __tablename__ = "meta_model_release"

    id = db.Column(db.Integer, primary_key=True)
    release_no = db.Column(db.String(64), nullable=False, unique=True)
    status = db.Column(db.String(32), nullable=False, default="published")
    released_by = db.Column(db.String(128), nullable=False)
    released_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)


class MetaModelReleaseItem(db.Model):
    __tablename__ = "meta_model_release_item"

    id = db.Column(db.Integer, primary_key=True)
    release_id = db.Column(db.Integer, db.ForeignKey("meta_model_release.id"), nullable=False)
    model_definition_id = db.Column(db.Integer, db.ForeignKey("meta_model_definition.id"), nullable=False)
    checksum = db.Column(db.String(128), nullable=False)


class MetaModelChangeLog(db.Model):
    __tablename__ = "meta_model_change_log"

    id = db.Column(db.Integer, primary_key=True)
    model_definition_id = db.Column(db.Integer, db.ForeignKey("meta_model_definition.id"), nullable=False)
    change_type = db.Column(db.String(32), nullable=False)
    diff_json = db.Column(db.JSON, nullable=True)
    operator = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)


class EventTypeRegistry(db.Model):
    __tablename__ = "event_type_registry"

    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(128), nullable=False)
    model_def_id = db.Column(db.Integer, db.ForeignKey("meta_model_definition.id"), nullable=False)
    payload_schema = db.Column(db.JSON, nullable=True)
    version = db.Column(db.String(32), nullable=False, default="1.0.0")


class EventSubscriptionRegistry(db.Model):
    __tablename__ = "event_subscription_registry"

    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(128), nullable=False)
    target_type = db.Column(db.String(64), nullable=False)
    target_ref = db.Column(db.String(256), nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)


class UserAccount(db.Model):
    __tablename__ = "user_account"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(128), nullable=False, unique=True)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(64), nullable=False)
    token = db.Column(db.String(128), nullable=False, unique=True)
    full_name = db.Column(db.String(128), nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)


class ContractRecord(db.Model):
    __tablename__ = "contract_record"

    id = db.Column(db.String(128), primary_key=True)
    contract_no = db.Column(db.String(128), nullable=False, unique=True)
    title = db.Column(db.String(256), nullable=True)
    counterparty = db.Column(db.String(256), nullable=True)
    amount = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(64), nullable=False, default="draft")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    def to_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "contract_no": self.contract_no,
            "title": self.title,
            "counterparty": self.counterparty,
            "amount": self.amount,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class CustomerRecord(db.Model):
    __tablename__ = "customer_record"

    id = db.Column(db.String(128), primary_key=True)
    customer_no = db.Column(db.String(128), nullable=False, unique=True)
    name = db.Column(db.String(256), nullable=False)
    industry = db.Column(db.String(128), nullable=True)
    status = db.Column(db.String(64), nullable=False, default="active")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    def to_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "customer_no": self.customer_no,
            "name": self.name,
            "industry": self.industry,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class EmployeeRecord(db.Model):
    __tablename__ = "employee_record"

    id = db.Column(db.String(128), primary_key=True)
    employee_no = db.Column(db.String(128), nullable=False, unique=True)
    name = db.Column(db.String(256), nullable=False)
    department = db.Column(db.String(128), nullable=True)
    job_title = db.Column(db.String(128), nullable=True)
    status = db.Column(db.String(64), nullable=False, default="active")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    def to_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "employee_no": self.employee_no,
            "name": self.name,
            "department": self.department,
            "job_title": self.job_title,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ProductRecord(db.Model):
    __tablename__ = "product_record"

    id = db.Column(db.String(128), primary_key=True)
    product_no = db.Column(db.String(128), nullable=False, unique=True)
    name = db.Column(db.String(256), nullable=False)
    category = db.Column(db.String(128), nullable=True)
    price = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(64), nullable=False, default="active")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    def to_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "product_no": self.product_no,
            "name": self.name,
            "category": self.category,
            "price": self.price,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class InvoiceRecord(db.Model):
    __tablename__ = "invoice_record"

    id = db.Column(db.String(128), primary_key=True)
    invoice_no = db.Column(db.String(128), nullable=False, unique=True)
    customer_id = db.Column(db.String(128), nullable=False)
    contract_id = db.Column(db.String(128), nullable=True)
    amount = db.Column(db.Float, nullable=True)
    status = db.Column(db.String(64), nullable=False, default="draft")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    def to_dict(self) -> dict[str, object]:
        return {
            "id": self.id,
            "invoice_no": self.invoice_no,
            "customer_id": self.customer_id,
            "contract_id": self.contract_id,
            "amount": self.amount,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
