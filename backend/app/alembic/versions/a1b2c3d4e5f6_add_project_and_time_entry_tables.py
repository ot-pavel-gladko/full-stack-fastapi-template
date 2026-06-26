"""Add project and time_entry tables

Revision ID: a1b2c3d4e5f6
Revises: 1a31ce608336
Create Date: 2026-06-26 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '1a31ce608336'
branch_labels = None
depends_on = None


def upgrade():
    # Create project table
    op.create_table(
        'project',
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=1000), nullable=True),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False, server_default='active'),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    # Create time_entry table
    op.create_table(
        'time_entry',
        sa.Column('project_id', sa.Uuid(), nullable=False),
        sa.Column('entry_date', sa.Date(), nullable=False),
        sa.Column('hours', sa.Numeric(precision=6, scale=2), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=1000), nullable=True),
        sa.Column('is_billable', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('time_entry')
    op.drop_table('project')
