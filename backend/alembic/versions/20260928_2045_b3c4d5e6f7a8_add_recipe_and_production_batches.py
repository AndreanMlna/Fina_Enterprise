"""add_recipe_and_production_batches

Revision ID: b3c4d5e6f7a8
Revises: a2b3c4d5e6f7
Create Date: 2026-09-28 20:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b3c4d5e6f7a8'
down_revision: Union[str, None] = 'a2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    # 1. Products Table (Create if not exists, or add overhead & wastage columns if exists)
    if 'products' not in tables:
        op.create_table(
            'products',
            sa.Column('id', sa.String(length=64), primary_key=True),
            sa.Column('tenant_id', sa.String(length=64), sa.ForeignKey('tenants.id'), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('sku', sa.String(length=64), nullable=False),
            sa.Column('category', sa.String(length=64), nullable=False),
            sa.Column('price', sa.Numeric(precision=18, scale=2), nullable=False),
            sa.Column('cogs', sa.Numeric(precision=18, scale=2), server_default='0.00'),
            sa.Column('stock', sa.Integer(), server_default='0'),
            sa.Column('unit', sa.String(length=32), server_default='Porsi'),
            sa.Column('image_url', sa.String(length=512), nullable=True),
            sa.Column('overhead_cost_per_unit', sa.Numeric(precision=18, scale=2), server_default='0.00'),
            sa.Column('wastage_percent', sa.Numeric(precision=6, scale=2), server_default='0.00'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
        )
        op.create_index(op.f('ix_products_id'), 'products', ['id'], unique=False)
        op.create_index(op.f('ix_products_tenant_id'), 'products', ['tenant_id'], unique=False)
        op.create_index(op.f('ix_products_sku'), 'products', ['sku'], unique=False)
    else:
        cols = [c['name'] for c in inspector.get_columns('products')]
        if 'overhead_cost_per_unit' not in cols:
            op.add_column('products', sa.Column('overhead_cost_per_unit', sa.Numeric(18, 2), nullable=True, server_default='0.0'))
        if 'wastage_percent' not in cols:
            op.add_column('products', sa.Column('wastage_percent', sa.Numeric(6, 2), nullable=True, server_default='0.0'))

    # 2. Product Recipe Items Table
    if 'product_recipe_items' not in tables:
        op.create_table(
            'product_recipe_items',
            sa.Column('id', sa.String(length=64), nullable=False),
            sa.Column('tenant_id', sa.String(length=64), nullable=False),
            sa.Column('product_id', sa.String(length=64), nullable=False),
            sa.Column('material_id', sa.String(length=64), nullable=True),
            sa.Column('material_name', sa.String(length=255), nullable=False),
            sa.Column('quantity_required', sa.Numeric(18, 4), nullable=False),
            sa.Column('unit', sa.String(length=32), nullable=False, server_default='Pcs'),
            sa.Column('cost_per_unit', sa.Numeric(18, 2), nullable=False, server_default='0.0'),
            sa.Column('notes', sa.String(length=255), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
            sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['material_id'], ['products.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_product_recipe_items_id'), 'product_recipe_items', ['id'], unique=False)
        op.create_index(op.f('ix_product_recipe_items_tenant_id'), 'product_recipe_items', ['tenant_id'], unique=False)
        op.create_index(op.f('ix_product_recipe_items_product_id'), 'product_recipe_items', ['product_id'], unique=False)

    # 3. Production Batches Table
    if 'production_batches' not in tables:
        op.create_table(
            'production_batches',
            sa.Column('id', sa.String(length=64), nullable=False),
            sa.Column('tenant_id', sa.String(length=64), nullable=False),
            sa.Column('product_id', sa.String(length=64), nullable=False),
            sa.Column('batch_number', sa.String(length=64), nullable=False),
            sa.Column('quantity_produced', sa.Integer(), nullable=False),
            sa.Column('total_material_cost', sa.Numeric(18, 2), nullable=False),
            sa.Column('overhead_cost', sa.Numeric(18, 2), nullable=False, server_default='0.0'),
            sa.Column('wastage_percent', sa.Numeric(6, 2), nullable=False, server_default='0.0'),
            sa.Column('unit_cost_hpp', sa.Numeric(18, 2), nullable=False),
            sa.Column('selling_price_at_production', sa.Numeric(18, 2), nullable=False),
            sa.Column('recommended_price', sa.Numeric(18, 2), nullable=False),
            sa.Column('margin_status', sa.String(length=32), nullable=False, server_default='HEALTHY'),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
            sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_production_batches_id'), 'production_batches', ['id'], unique=False)
        op.create_index(op.f('ix_production_batches_tenant_id'), 'production_batches', ['tenant_id'], unique=False)
        op.create_index(op.f('ix_production_batches_product_id'), 'production_batches', ['product_id'], unique=False)
        op.create_index(op.f('ix_production_batches_batch_number'), 'production_batches', ['batch_number'], unique=True)

    # 4. POS Receipts Table
    if 'pos_receipts' not in tables:
        op.create_table(
            'pos_receipts',
            sa.Column('id', sa.String(length=64), primary_key=True),
            sa.Column('tenant_id', sa.String(length=64), sa.ForeignKey('tenants.id'), nullable=False),
            sa.Column('receipt_number', sa.String(length=64), nullable=False),
            sa.Column('journal_entry_number', sa.String(length=64), nullable=False),
            sa.Column('cashier_name', sa.String(length=255), nullable=False),
            sa.Column('customer_name', sa.String(length=255), nullable=False),
            sa.Column('customer_phone', sa.String(length=64), nullable=True),
            sa.Column('subtotal', sa.Numeric(precision=18, scale=2), nullable=False),
            sa.Column('total_discount', sa.Numeric(precision=18, scale=2), server_default='0.00'),
            sa.Column('tax_pp55_estimated', sa.Numeric(precision=18, scale=2), server_default='0.00'),
            sa.Column('grand_total', sa.Numeric(precision=18, scale=2), nullable=False),
            sa.Column('payment_method', sa.String(length=32), nullable=False),
            sa.Column('cash_tendered', sa.Numeric(precision=18, scale=2), server_default='0.00'),
            sa.Column('change_amount', sa.Numeric(precision=18, scale=2), server_default='0.00'),
            sa.Column('audit_merkle_hash', sa.String(length=128), nullable=False),
            sa.Column('items_json', sa.Text(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
        )
        op.create_index(op.f('ix_pos_receipts_id'), 'pos_receipts', ['id'], unique=False)
        op.create_index(op.f('ix_pos_receipts_tenant_id'), 'pos_receipts', ['tenant_id'], unique=False)
        op.create_index(op.f('ix_pos_receipts_receipt_number'), 'pos_receipts', ['receipt_number'], unique=True)
        op.create_index(op.f('ix_pos_receipts_journal_entry_number'), 'pos_receipts', ['journal_entry_number'], unique=False)

    # 5. Loan Evaluations Table (Anti-Predatory Loan Analyzer)
    if 'loan_evaluations' not in tables:
        op.create_table(
            'loan_evaluations',
            sa.Column('id', sa.String(length=64), primary_key=True),
            sa.Column('tenant_id', sa.String(length=64), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
            sa.Column('provider_name', sa.String(length=255), nullable=False),
            sa.Column('requested_amount', sa.Numeric(precision=18, scale=2), nullable=False),
            sa.Column('admin_fee_percent', sa.Numeric(precision=8, scale=2), nullable=False),
            sa.Column('upfront_deduction', sa.Numeric(precision=18, scale=2), nullable=False),
            sa.Column('disbursed_amount', sa.Numeric(precision=18, scale=2), nullable=False),
            sa.Column('daily_interest_rate', sa.Numeric(precision=8, scale=4), nullable=False),
            sa.Column('tenor_days', sa.Integer(), nullable=False),
            sa.Column('total_repayment', sa.Numeric(precision=18, scale=2), nullable=False),
            sa.Column('effective_annual_apr', sa.Numeric(precision=10, scale=2), nullable=False),
            sa.Column('is_legal_ojk', sa.Boolean(), server_default='false', nullable=False),
            sa.Column('threat_level', sa.String(length=32), server_default='MODERATE', nullable=False),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
        )
        op.create_index(op.f('ix_loan_evaluations_id'), 'loan_evaluations', ['id'], unique=False)
        op.create_index(op.f('ix_loan_evaluations_tenant_id'), 'loan_evaluations', ['tenant_id'], unique=False)

    # 6. Commodity Benchmarks Table (Harga Komoditas Bapanas)
    if 'commodity_benchmarks' not in tables:
        op.create_table(
            'commodity_benchmarks',
            sa.Column('id', sa.String(length=64), primary_key=True),
            sa.Column('commodity_name', sa.String(length=255), unique=True, nullable=False),
            sa.Column('category', sa.String(length=64), nullable=False),
            sa.Column('unit', sa.String(length=32), server_default='Kg', nullable=False),
            sa.Column('market_median_price', sa.Numeric(precision=18, scale=2), nullable=False),
            sa.Column('source', sa.String(length=255), server_default='Bapanas & Pasar Induk Nasional'),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now())
        )
        op.create_index(op.f('ix_commodity_benchmarks_id'), 'commodity_benchmarks', ['id'], unique=False)
        op.create_index(op.f('ix_commodity_benchmarks_commodity_name'), 'commodity_benchmarks', ['commodity_name'], unique=True)

    # 7. Supplier Quotes Table
    if 'supplier_quotes' not in tables:
        op.create_table(
            'supplier_quotes',
            sa.Column('id', sa.String(length=64), primary_key=True),
            sa.Column('tenant_id', sa.String(length=64), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
            sa.Column('supplier_name', sa.String(length=255), nullable=False),
            sa.Column('commodity_name', sa.String(length=255), nullable=False),
            sa.Column('unit', sa.String(length=32), server_default='Kg', nullable=False),
            sa.Column('purchase_price', sa.Numeric(precision=18, scale=2), nullable=False),
            sa.Column('is_contract_active', sa.Boolean(), server_default='true', nullable=False),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
        )
        op.create_index(op.f('ix_supplier_quotes_id'), 'supplier_quotes', ['id'], unique=False)
        op.create_index(op.f('ix_supplier_quotes_tenant_id'), 'supplier_quotes', ['tenant_id'], unique=False)

    # 8. Receipt Forensics Table (Error Level Analysis - ELA)
    if 'receipt_forensics' not in tables:
        op.create_table(
            'receipt_forensics',
            sa.Column('id', sa.String(length=64), primary_key=True),
            sa.Column('tenant_id', sa.String(length=64), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
            sa.Column('receipt_number', sa.String(length=64), nullable=False),
            sa.Column('merchant_name', sa.String(length=255), nullable=False),
            sa.Column('transaction_date', sa.String(length=32), nullable=False),
            sa.Column('subtotal', sa.Numeric(precision=18, scale=2), nullable=False),
            sa.Column('tax_amount', sa.Numeric(precision=18, scale=2), server_default='0.00', nullable=False),
            sa.Column('grand_total', sa.Numeric(precision=18, scale=2), nullable=False),
            sa.Column('ela_integrity_score', sa.Integer(), server_default='100', nullable=False),
            sa.Column('is_tampered', sa.Boolean(), server_default='false', nullable=False),
            sa.Column('tampering_details', sa.Text(), nullable=True),
            sa.Column('items_json', sa.Text(), nullable=True),
            sa.Column('audit_merkle_hash', sa.String(length=128), nullable=False),
            sa.Column('status', sa.String(length=32), server_default='VERIFIED', nullable=False),
            sa.Column('journal_entry_id', sa.String(length=64), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
        )
        op.create_index(op.f('ix_receipt_forensics_id'), 'receipt_forensics', ['id'], unique=False)
        op.create_index(op.f('ix_receipt_forensics_tenant_id'), 'receipt_forensics', ['tenant_id'], unique=False)
        op.create_index(op.f('ix_receipt_forensics_receipt_number'), 'receipt_forensics', ['receipt_number'], unique=False)


def downgrade() -> None:
    op.drop_table('receipt_forensics')
    op.drop_table('supplier_quotes')
    op.drop_table('commodity_benchmarks')
    op.drop_table('loan_evaluations')
    op.drop_table('pos_receipts')
    op.drop_table('production_batches')
    op.drop_table('product_recipe_items')
    op.drop_table('products')
