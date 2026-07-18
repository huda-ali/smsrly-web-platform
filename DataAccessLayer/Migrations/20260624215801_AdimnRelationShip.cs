using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccessLayer.Migrations
{
    /// <inheritdoc />
    public partial class AdimnRelationShip : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Admins",
                columns: table => new
                {
                    UsserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Admins", x => x.UsserId);
                });

            migrationBuilder.CreateTable(
                name: "Property",
                columns: table => new
                {
                    ProperyID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NumberOFRooms = table.Column<int>(type: "int", nullable: false),
                    RentPrice = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ImageUrls = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ManageAdminUsserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Property", x => x.ProperyID);
                    table.ForeignKey(
                        name: "FK_Property_Admins_ManageAdminUsserId",
                        column: x => x.ManageAdminUsserId,
                        principalTable: "Admins",
                        principalColumn: "UsserId");
                });

            migrationBuilder.CreateTable(
                name: "User",
                columns: table => new
                {
                    UsserId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FirstName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Password = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    adminUsserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_User", x => x.UsserId);
                    table.ForeignKey(
                        name: "FK_User_Admins_adminUsserId",
                        column: x => x.adminUsserId,
                        principalTable: "Admins",
                        principalColumn: "UsserId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Property_ManageAdminUsserId",
                table: "Property",
                column: "ManageAdminUsserId");

            migrationBuilder.CreateIndex(
                name: "IX_User_adminUsserId",
                table: "User",
                column: "adminUsserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Admins_User_UsserId",
                table: "Admins",
                column: "UsserId",
                principalTable: "User",
                principalColumn: "UsserId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Admins_User_UsserId",
                table: "Admins");

            migrationBuilder.DropTable(
                name: "Property");

            migrationBuilder.DropTable(
                name: "User");

            migrationBuilder.DropTable(
                name: "Admins");
        }
    }
}
