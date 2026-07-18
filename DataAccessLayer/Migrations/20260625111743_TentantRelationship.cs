using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccessLayer.Migrations
{
    /// <inheritdoc />
    public partial class TentantRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Review",
                columns: table => new
                {
                    ReviewID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReciveDate = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReadDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TimewStamp = table.Column<TimeSpan>(type: "time", nullable: false),
                    ReviewdPropertyProperyID = table.Column<int>(type: "int", nullable: false),
                    ReiewerUsserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Review", x => x.ReviewID);
                    table.ForeignKey(
                        name: "FK_Review_Property_ReviewdPropertyProperyID",
                        column: x => x.ReviewdPropertyProperyID,
                        principalTable: "Property",
                        principalColumn: "ProperyID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Review_Tentant_ReiewerUsserId",
                        column: x => x.ReiewerUsserId,
                        principalTable: "Tentant",
                        principalColumn: "UsserId");
                });

            migrationBuilder.CreateTable(
                name: "Service",
                columns: table => new
                {
                    ServiceID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ServiceName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ServiceType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Service", x => x.ServiceID);
                });

            migrationBuilder.CreateTable(
                name: "PropertyService",
                columns: table => new
                {
                    PropertiesProperyID = table.Column<int>(type: "int", nullable: false),
                    ServicesServiceID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropertyService", x => new { x.PropertiesProperyID, x.ServicesServiceID });
                    table.ForeignKey(
                        name: "FK_PropertyService_Property_PropertiesProperyID",
                        column: x => x.PropertiesProperyID,
                        principalTable: "Property",
                        principalColumn: "ProperyID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PropertyService_Service_ServicesServiceID",
                        column: x => x.ServicesServiceID,
                        principalTable: "Service",
                        principalColumn: "ServiceID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PropertyService_ServicesServiceID",
                table: "PropertyService",
                column: "ServicesServiceID");

            migrationBuilder.CreateIndex(
                name: "IX_Review_ReiewerUsserId",
                table: "Review",
                column: "ReiewerUsserId");

            migrationBuilder.CreateIndex(
                name: "IX_Review_ReviewdPropertyProperyID",
                table: "Review",
                column: "ReviewdPropertyProperyID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PropertyService");

            migrationBuilder.DropTable(
                name: "Review");

            migrationBuilder.DropTable(
                name: "Service");
        }
    }
}
