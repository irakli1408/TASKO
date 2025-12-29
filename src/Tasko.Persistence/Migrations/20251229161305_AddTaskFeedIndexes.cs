using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tasko.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskFeedIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tasks_Status",
                table: "Tasks");

            migrationBuilder.DropIndex(
                name: "IX_ExecutorLocations_LocationType",
                table: "ExecutorLocations");

            migrationBuilder.DropIndex(
                name: "IX_ExecutorCategories_CategoryId",
                table: "ExecutorCategories");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_Status_CategoryId_LocationType_CreatedAtUtc",
                table: "Tasks",
                columns: new[] { "Status", "CategoryId", "LocationType", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ExecutorLocations_LocationType_UserId",
                table: "ExecutorLocations",
                columns: new[] { "LocationType", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_ExecutorCategories_CategoryId_UserId",
                table: "ExecutorCategories",
                columns: new[] { "CategoryId", "UserId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tasks_Status_CategoryId_LocationType_CreatedAtUtc",
                table: "Tasks");

            migrationBuilder.DropIndex(
                name: "IX_ExecutorLocations_LocationType_UserId",
                table: "ExecutorLocations");

            migrationBuilder.DropIndex(
                name: "IX_ExecutorCategories_CategoryId_UserId",
                table: "ExecutorCategories");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_Status",
                table: "Tasks",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ExecutorLocations_LocationType",
                table: "ExecutorLocations",
                column: "LocationType");

            migrationBuilder.CreateIndex(
                name: "IX_ExecutorCategories_CategoryId",
                table: "ExecutorCategories",
                column: "CategoryId");
        }
    }
}
