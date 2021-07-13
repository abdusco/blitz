using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Blitz.Web.Migrations
{
    public partial class AddTemplateSupport : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "template_id",
                table: "projects",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "template_id",
                table: "cronjobs",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_projects_template_id",
                table: "projects",
                column: "template_id");

            migrationBuilder.CreateIndex(
                name: "ix_cronjobs_template_id",
                table: "cronjobs",
                column: "template_id");

            migrationBuilder.AddForeignKey(
                name: "fk_cronjobs_config_templates_template_id",
                table: "cronjobs",
                column: "template_id",
                principalTable: "config_templates",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_projects_config_templates_template_id",
                table: "projects",
                column: "template_id",
                principalTable: "config_templates",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_cronjobs_config_templates_template_id",
                table: "cronjobs");

            migrationBuilder.DropForeignKey(
                name: "fk_projects_config_templates_template_id",
                table: "projects");

            migrationBuilder.DropIndex(
                name: "ix_projects_template_id",
                table: "projects");

            migrationBuilder.DropIndex(
                name: "ix_cronjobs_template_id",
                table: "cronjobs");

            migrationBuilder.DropColumn(
                name: "template_id",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "template_id",
                table: "cronjobs");
        }
    }
}
