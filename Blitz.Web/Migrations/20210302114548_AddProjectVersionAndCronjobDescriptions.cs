using Microsoft.EntityFrameworkCore.Migrations;

namespace Blitz.Web.Migrations
{
    public partial class AddProjectVersionAndCronjobDescriptions : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "version",
                table: "projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "description",
                table: "cronjobs",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_projects_title_version",
                table: "projects",
                columns: new[] { "title", "version" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_projects_title_version",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "version",
                table: "projects");

            migrationBuilder.DropColumn(
                name: "description",
                table: "cronjobs");
        }
    }
}
