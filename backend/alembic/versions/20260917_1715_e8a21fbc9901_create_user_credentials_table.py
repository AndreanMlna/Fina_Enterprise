"""create_user_credentials_table

Revision ID: e8a21fbc9901
Revises: de71eee82ee0
Create Date: 2026-09-17 17:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'e8a21fbc9901'
down_revision: Union[str, None] = 'de71eee82ee0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create user_credentials table
    op.create_table(
        'user_credentials',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('tenant_id', sa.String(length=64), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('phone_number', sa.String(length=32), nullable=False, unique=True),
        sa.Column('pin_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=32), server_default='OWNER', nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('failed_attempts', sa.Integer(), server_default='0', nullable=False),
        sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )
    op.create_index('ix_user_credentials_id', 'user_credentials', ['id'])
    op.create_index('ix_user_credentials_tenant_id', 'user_credentials', ['tenant_id'])
    op.create_index('ix_user_credentials_phone_number', 'user_credentials', ['phone_number'])


def downgrade() -> None:
    op.drop_table('user_credentials')
