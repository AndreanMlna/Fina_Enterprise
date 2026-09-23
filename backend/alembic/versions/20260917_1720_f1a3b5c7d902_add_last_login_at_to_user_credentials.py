"""add_last_login_at_to_user_credentials

Revision ID: f1a3b5c7d902
Revises: e8a21fbc9901
Create Date: 2026-09-17 17:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'f1a3b5c7d902'
down_revision: Union[str, None] = 'e8a21fbc9901'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('user_credentials', sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('user_credentials', 'last_login_at')
