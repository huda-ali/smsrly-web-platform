using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccessLayer.Migrations
{
    /// <inheritdoc />
    public partial class OwnerRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "OwnerUsserId",
                table: "Property",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Owner",
                columns: table => new
                {
                    UsserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Owner", x => x.UsserId);
                    table.ForeignKey(
                        name: "FK_Owner_User_UsserId",
                        column: x => x.UsserId,
                        principalTable: "User",
                        principalColumn: "UsserId",
                        onDelete: ReferentialAction.Cascade);
                });

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

            migrationBuilder.CreateTable(
                name: "Message",
                columns: table => new
                {
                    MessageID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SenderFlag = table.Column<int>(type: "int", nullable: false),
                    ReciveDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReadDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TimeStamp = table.Column<TimeSpan>(type: "time", nullable: false),
                    Isdeleted = table.Column<bool>(type: "bit", nullable: false),
                    OwnerUsserId = table.Column<int>(type: "int", nullable: false),
                    tentantUsserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Message", x => x.MessageID);
                    table.ForeignKey(
                        name: "FK_Message_Owner_OwnerUsserId",
                        column: x => x.OwnerUsserId,
                        principalTable: "Owner",
                        principalColumn: "UsserId");
                    table.ForeignKey(
                        name: "FK_Message_Tentant_tentantUsserId",
                        column: x => x.tentantUsserId,
                        principalTable: "Tentant",
                        principalColumn: "UsserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Property_OwnerUsserId",
                table: "Property",
                column: "OwnerUsserId");

            migrationBuilder.CreateIndex(
                name: "IX_Message_OwnerUsserId",
                table: "Message",
                column: "OwnerUsserId");

            migrationBuilder.CreateIndex(
                name: "IX_Message_tentantUsserId",
                table: "Message",
                column: "tentantUsserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Property_Owner_OwnerUsserId",
                table: "Property",
                column: "OwnerUsserId",
                principalTable: "Owner",
                principalColumn: "UsserId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Property_Owner_OwnerUsserId",
                table: "Property");

            migrationBuilder.DropTable(
                name: "Message");

            migrationBuilder.DropTable(
                name: "Owner");

            migrationBuilder.DropTable(
                name: "Tentant");

            migrationBuilder.DropIndex(
                name: "IX_Property_OwnerUsserId",
                table: "Property");

            migrationBuilder.DropColumn(
                name: "OwnerUsserId",
                table: "Property");
        }
    }
}
