using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tasko.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ChatAsReadTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChatReadStates",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TaskId = table.Column<long>(type: "bigint", nullable: false),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    LastReadMessageId = table.Column<long>(type: "bigint", nullable: false),
                    ReadAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatReadStates", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatReadStates_TaskId_UserId",
                table: "ChatReadStates",
                columns: new[] { "TaskId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChatReadStates_UserId_TaskId",
                table: "ChatReadStates",
                columns: new[] { "UserId", "TaskId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChatReadStates");
        }
    }
}
