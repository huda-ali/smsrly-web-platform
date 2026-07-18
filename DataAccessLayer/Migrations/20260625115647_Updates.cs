using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccessLayer.Migrations
{
    /// <inheritdoc />
    public partial class Updates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "ReciveDate",
                table: "Review",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<TimeSpan>(
                name: "TimewStamp",
                table: "Review",
                type: "time",
                nullable: false,
                computedColumnSql: "DATEDIFF(SECOND, [ReciveDate], [ReadDate]) / 3600.0",
                stored: true,
                oldClrType: typeof(TimeSpan),
                oldType: "time");

            migrationBuilder.AlterColumn<TimeSpan>(
                name: "TimeStamp",
                table: "Message",
                type: "time",
                nullable: false,
                computedColumnSql: "DATEDIFF(SECOND, [ReciveDate], [ReadDate]) / 3600.0",
                stored: true,
                oldClrType: typeof(TimeSpan),
                oldType: "time");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<TimeSpan>(
                name: "TimewStamp",
                table: "Review",
                type: "time",
                nullable: false,
                oldClrType: typeof(TimeSpan),
                oldType: "time",
                oldComputedColumnSql: "DATEDIFF(SECOND, [ReciveDate], [ReadDate]) / 3600.0");

            migrationBuilder.AlterColumn<string>(
                name: "ReciveDate",
                table: "Review",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<TimeSpan>(
                name: "TimeStamp",
                table: "Message",
                type: "time",
                nullable: false,
                oldClrType: typeof(TimeSpan),
                oldType: "time",
                oldComputedColumnSql: "DATEDIFF(SECOND, [ReciveDate], [ReadDate]) / 3600.0");
        }
    }
}
