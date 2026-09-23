"""create_fina_enterprise_initial_tables

Revision ID: de71eee82ee0
Revises: 
Create Date: 2026-09-17 15:14:42.959741

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'de71eee82ee0'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 0. Check and enable pgvector extension if available on host OS
    bind = op.get_bind()
    vector_available = bind.execute(sa.text("SELECT 1 FROM pg_available_extensions WHERE name = 'vector'")).scalar()
    if vector_available:
        op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # 1. Tenants Table
    op.create_table(
        'tenants',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('branch_code', sa.String(length=32), nullable=False, unique=True),
        sa.Column('npwp', sa.String(length=64), nullable=False),
        sa.Column('address', sa.String(length=512), nullable=False),
        sa.Column('active_license', sa.String(length=64), server_default='ENTERPRISE_LIFETIME'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now())
    )
    op.create_index('ix_tenants_id', 'tenants', ['id'])
    op.create_index('ix_tenants_branch_code', 'tenants', ['branch_code'])

    # 2. Chart of Accounts (COA) Table
    op.create_table(
        'accounts',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('code', sa.String(length=32), nullable=False, unique=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=32), nullable=False),
        sa.Column('normal_balance', sa.String(length=8), nullable=False),
        sa.Column('balance', sa.Numeric(precision=18, scale=2), server_default='0.00'),
    )
    op.create_index('ix_accounts_id', 'accounts', ['id'])
    op.create_index('ix_accounts_code', 'accounts', ['code'])

    # 3. Journal Entries Table
    op.create_table(
        'journal_entries',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('tenant_id', sa.String(length=64), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('entry_number', sa.String(length=64), nullable=False, unique=True),
        sa.Column('entry_date', sa.String(length=32), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=32), server_default='POSTED'),
        sa.Column('audit_merkle_hash', sa.String(length=128), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now())
    )
    op.create_index('ix_journal_entries_id', 'journal_entries', ['id'])
    op.create_index('ix_journal_entries_tenant_id', 'journal_entries', ['tenant_id'])
    op.create_index('ix_journal_entries_entry_number', 'journal_entries', ['entry_number'])

    # 4. Journal Lines Table
    op.create_table(
        'journal_lines',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('entry_id', sa.String(length=64), sa.ForeignKey('journal_entries.id', ondelete='CASCADE'), nullable=False),
        sa.Column('account_id', sa.String(length=64), sa.ForeignKey('accounts.id'), nullable=False),
        sa.Column('debit', sa.Numeric(precision=18, scale=2), server_default='0.00'),
        sa.Column('credit', sa.Numeric(precision=18, scale=2), server_default='0.00'),
        sa.Column('memo', sa.String(length=255), nullable=True)
    )
    op.create_index('ix_journal_lines_id', 'journal_lines', ['id'])
    op.create_index('ix_journal_lines_entry_id', 'journal_lines', ['entry_id'])
    op.create_index('ix_journal_lines_account_id', 'journal_lines', ['account_id'])

    # 5. Dialect Lexicons with pgvector Table
    op.create_table(
        'dialect_lexicons',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('dialect', sa.String(length=32), nullable=False),
        sa.Column('raw_term', sa.String(length=255), nullable=False),
        sa.Column('canonical_term', sa.String(length=255), nullable=False),
        sa.Column('target_coa_code', sa.String(length=32), nullable=False),
        sa.Column('action_type', sa.String(length=16), server_default='BELI'),
        sa.Column('sample_sentence', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now())
    )
    op.create_index('ix_dialect_lexicons_id', 'dialect_lexicons', ['id'])
    op.create_index('ix_dialect_lexicons_dialect', 'dialect_lexicons', ['dialect'])
    op.create_index('ix_dialect_lexicons_raw_term', 'dialect_lexicons', ['raw_term'])

    # Add 1536-dim vector column (native vector if extension available, otherwise resilient jsonb)
    if vector_available:
        op.execute("ALTER TABLE dialect_lexicons ADD COLUMN IF NOT EXISTS embedding vector(1536);")
    else:
        op.execute("ALTER TABLE dialect_lexicons ADD COLUMN IF NOT EXISTS embedding jsonb;")

    # 6. Invoices Table (AR Dunning SNAP QRIS)
    op.create_table(
        'invoices',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('tenant_id', sa.String(length=64), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('invoice_number', sa.String(length=64), nullable=False, unique=True),
        sa.Column('customer_name', sa.String(length=255), nullable=False),
        sa.Column('customer_phone', sa.String(length=64), nullable=False),
        sa.Column('amount', sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column('due_date', sa.String(length=32), nullable=False),
        sa.Column('days_overdue', sa.Integer(), server_default='0'),
        sa.Column('status', sa.String(length=32), server_default='CURRENT'),
        sa.Column('suggested_tone', sa.String(length=32), server_default='FRIENDLY'),
        sa.Column('snap_qris_url', sa.String(length=512), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now())
    )
    op.create_index('ix_invoices_id', 'invoices', ['id'])
    op.create_index('ix_invoices_tenant_id', 'invoices', ['tenant_id'])
    op.create_index('ix_invoices_invoice_number', 'invoices', ['invoice_number'])

    # 7. Support Tickets Table (CS Backoffice & HITL Desk)
    op.create_table(
        'support_tickets',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('ticket_number', sa.String(length=64), nullable=False, unique=True),
        sa.Column('tenant_id', sa.String(length=64), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_phone', sa.String(length=64), nullable=False),
        sa.Column('category', sa.String(length=64), nullable=False),
        sa.Column('priority', sa.String(length=32), server_default='MEDIUM'),
        sa.Column('status', sa.String(length=32), server_default='OPEN'),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('ai_confidence_score', sa.Integer(), server_default='75'),
        sa.Column('suggested_resolution', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('resolved_at', sa.DateTime(), nullable=True)
    )
    op.create_index('ix_support_tickets_id', 'support_tickets', ['id'])
    op.create_index('ix_support_tickets_ticket_number', 'support_tickets', ['ticket_number'])
    op.create_index('ix_support_tickets_tenant_id', 'support_tickets', ['tenant_id'])


def downgrade() -> None:
    op.drop_table('support_tickets')
    op.drop_table('invoices')
    op.drop_table('dialect_lexicons')
    op.drop_table('journal_lines')
    op.drop_table('journal_entries')
    op.drop_table('accounts')
    op.drop_table('tenants')
