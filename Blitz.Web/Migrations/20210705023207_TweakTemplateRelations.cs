using Microsoft.EntityFrameworkCore.Migrations;

namespace Blitz.Web.Migrations
{
    public partial class TweakTemplateRelations : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_cronjobs_config_templates_template_id",
                table: "cronjobs");

            migrationBuilder.DropForeignKey(
                name: "fk_projects_config_templates_template_id",
                table: "projects");

            migrationBuilder.AddForeignKey(
                name: "fk_cronjobs_config_templates_template_id",
                table: "cronjobs",
                column: "template_id",
                principalTable: "config_templates",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_projects_config_templates_template_id",
                table: "projects",
                column: "template_id",
                principalTable: "config_templates",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_cronjobs_config_templates_template_id",
                table: "cronjobs");

            migrationBuilder.DropForeignKey(
                name: "fk_projects_config_templates_template_id",
                table: "projects");

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
    }
}
