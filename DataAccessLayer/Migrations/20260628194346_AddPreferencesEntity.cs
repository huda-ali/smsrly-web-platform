using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccessLayer.Migrations
{
    /// <inheritdoc />
    public partial class AddPreferencesEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Message_Tentant_tentantUsserId",
                table: "Message");

            migrationBuilder.DropForeignKey(
                name: "FK_Review_Tentant_ReiewerUsserId",
                table: "Review");

            migrationBuilder.DropTable(
                name: "Tentant");

            migrationBuilder.CreateTable(
                name: "Tenant",
                columns: table => new
                {
                    UsserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tenant", x => x.UsserId);
                    table.ForeignKey(
                        name: "FK_Tenant_User_UsserId",
                        column: x => x.UsserId,
                        principalTable: "User",
                        principalColumn: "UsserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Preferences",
                columns: table => new
                {
                    PreferencesID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SoloOrShared = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PreferredLocation = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    LocationNearness = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    MinPrice = table.Column<int>(type: "int", nullable: false),
                    MaxPrice = table.Column<int>(type: "int", nullable: false),
                    NumberOfRooms = table.Column<int>(type: "int", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Services = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    TenantID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Preferences", x => x.PreferencesID);
                    table.ForeignKey(
                        name: "FK_Preferences_Tenant_TenantID",
                        column: x => x.TenantID,
                        principalTable: "Tenant",
                        principalColumn: "UsserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Preferences_TenantID",
                table: "Preferences",
                column: "TenantID",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Message_Tenant_tentantUsserId",
                table: "Message",
                column: "tentantUsserId",
                principalTable: "Tenant",
                principalColumn: "UsserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Review_Tenant_ReiewerUsserId",
                table: "Review",
                column: "ReiewerUsserId",
                principalTable: "Tenant",
                principalColumn: "UsserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Message_Tenant_tentantUsserId",
                table: "Message");

            migrationBuilder.DropForeignKey(
                name: "FK_Review_Tenant_ReiewerUsserId",
                table: "Review");

            migrationBuilder.DropTable(
                name: "Preferences");

            migrationBuilder.DropTable(
                name: "Tenant");

            migrationBuilder.CreateTable(
                name: "Tentant",
                columns: table => new
                {
                    UsserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tentant", x => x.UsserId);
                    table.ForeignKey(
                        name: "FK_Tentant_User_UsserId",
                        column: x => x.UsserId,
                        principalTable: "User",
                        principalColumn: "UsserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.AddForeignKey(
                name: "FK_Message_Tentant_tentantUsserId",
                table: "Message",
                column: "tentantUsserId",
                principalTable: "Tentant",
                principalColumn: "UsserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Review_Tentant_ReiewerUsserId",
                table: "Review",
                column: "ReiewerUsserId",
                principalTable: "Tentant",
                principalColumn: "UsserId");
        }
    }
}
