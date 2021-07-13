using Microsoft.EntityFrameworkCore.Migrations;

namespace Blitz.Web.Migrations
{
    public partial class AddProjectAuth : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "auth",
                table: "projects",
                type: "JSONB",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "auth",
                table: "projects");
        }
    }
}
