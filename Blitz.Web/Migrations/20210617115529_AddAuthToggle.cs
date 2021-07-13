using Microsoft.EntityFrameworkCore.Migrations;

namespace Blitz.Web.Migrations
{
    public partial class AddAuthToggle : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_authenticated",
                table: "cronjobs",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_authenticated",
                table: "cronjobs");
        }
    }
}
