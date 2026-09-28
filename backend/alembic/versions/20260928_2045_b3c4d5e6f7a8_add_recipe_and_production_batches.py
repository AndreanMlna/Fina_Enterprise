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
    # 1. Add overhead_cost_per_unit & wastage_percent to products table
    op.add_column(
        'products',
        sa.Column('overhead_cost_per_unit', sa.Numeric(18, 2), nullable=True, server_default='0.0')
    )
    op.add_column(
        'products',
        sa.Column('wastage_percent', sa.Numeric(6, 2), nullable=True, server_default='0.0')
    )

    # 2. Create product_recipe_items table
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

    # 3. Create production_batches table
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


def downgrade() -> None:
    op.drop_index(op.f('ix_production_batches_batch_number'), table_name='production_batches')
    op.drop_index(op.f('ix_production_batches_product_id'), table_name='production_batches')
    op.drop_index(op.f('ix_production_batches_tenant_id'), table_name='production_batches')
    op.drop_index(op.f('ix_production_batches_id'), table_name='production_batches')
    op.drop_table('production_batches')

    op.drop_index(op.f('ix_product_recipe_items_product_id'), table_name='product_recipe_items')
    op.drop_index(op.f('ix_product_recipe_items_tenant_id'), table_name='product_recipe_items')
    op.drop_index(op.f('ix_product_recipe_items_id'), table_name='product_recipe_items')
    op.drop_table('product_recipe_items')

    op.drop_column('products', 'wastage_percent')
    op.drop_column('products', 'overhead_cost_per_unit')
