using Microsoft.EntityFrameworkCore.Migrations;

namespace Blitz.Web.Migrations
{
    public partial class AddTemplateKey : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "key",
                table: "config_templates",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_config_templates_key",
                table: "config_templates",
                column: "key",
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_config_templates_key",
                table: "config_templates");

            migrationBuilder.DropColumn(
                name: "key",
                table: "config_templates");
        }
    }
}
