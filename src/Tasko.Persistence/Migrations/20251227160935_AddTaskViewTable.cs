using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tasko.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskViewTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ViewsCount",
                table: "Tasks",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "TaskViews",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TaskId = table.Column<long>(type: "bigint", nullable: false),
                    ViewerUserId = table.Column<long>(type: "bigint", nullable: false),
                    ViewedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskViews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaskViews_Tasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "Tasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TaskViews_TaskId",
                table: "TaskViews",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskViews_TaskId_ViewerUserId",
                table: "TaskViews",
                columns: new[] { "TaskId", "ViewerUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaskViews_ViewedAtUtc",
                table: "TaskViews",
                column: "ViewedAtUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TaskViews");

            migrationBuilder.DropColumn(
                name: "ViewsCount",
                table: "Tasks");
        }
    }
}
