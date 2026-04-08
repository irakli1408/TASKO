using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tasko.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class addNotificationPreference : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NotificationPreferences",
                columns: table => new
                {
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    NotifyNewOffers = table.Column<bool>(type: "bit", nullable: false),
                    NotifyTaskAssigned = table.Column<bool>(type: "bit", nullable: false),
                    NotifyNewMessages = table.Column<bool>(type: "bit", nullable: false),
                    NotifyTaskCompleted = table.Column<bool>(type: "bit", nullable: false),
                    NotifyMarketplaceUpdates = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationPreferences", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_NotificationPreferences_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NotificationPreferences");
        }
    }
}
