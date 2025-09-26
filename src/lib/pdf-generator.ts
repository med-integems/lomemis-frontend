// PDF Generation utility using jsPDF and html2canvas for client-side PDF generation
// Alternative: send data to backend to generate PDF using a proper PDF library

interface ReportData {
  title: string;
  dateRange: {
    from: string;
    to: string;
  };
  sections: ReportSection[];
}

interface ReportSection {
  title: string;
  content: string | { [key: string]: any };
  type?: "text" | "table" | "chart";
}

export class PDFGenerator {
  private static createHTMLContent(data: ReportData): string {
    const { title, dateRange, sections } = data;

    let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #007A33;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #007A33;
              margin: 0;
              font-size: 24px;
            }
            .date-range {
              color: #666;
              margin: 10px 0;
            }
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .section-title {
              background-color: #f8f9fa;
              padding: 10px 15px;
              border-left: 4px solid #007A33;
              margin-bottom: 15px;
              font-weight: bold;
              font-size: 16px;
            }
            .content {
              padding: 0 15px;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .table th,
            .table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .table th {
              background-color: #f8f9fa;
              font-weight: bold;
            }
            .table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .metric {
              display: inline-block;
              background: #f1f5f9;
              padding: 10px;
              margin: 5px;
              border-radius: 5px;
              min-width: 120px;
              text-align: center;
            }
            .metric-value {
              font-size: 18px;
              font-weight: bold;
              color: #007A33;
            }
            .metric-label {
              font-size: 12px;
              color: #666;
              margin-top: 5px;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            @media print {
              body { margin: 0; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LoMEMIS - ${title}</h1>
            <div class="date-range">Report Period: ${dateRange.from} to ${
      dateRange.to
    }</div>
            <div style="color: #666; font-size: 12px;">Generated on ${new Date().toLocaleString()}</div>
          </div>
    `;

    sections.forEach((section, index) => {
      html += `<div class="section">`;
      html += `<div class="section-title">${section.title}</div>`;
      html += `<div class="content">`;

      if (typeof section.content === "string") {
        html += `<p>${section.content}</p>`;
      } else if (section.type === "table" && Array.isArray(section.content)) {
        html += this.generateTableHTML(section.content);
      } else if (typeof section.content === "object") {
        html += this.generateMetricsHTML(section.content);
      }

      html += `</div></div>`;

      // Add page break for longer reports
      if (index < sections.length - 1 && sections.length > 3) {
        html += `<div class="page-break"></div>`;
      }
    });

    html += `
          <div class="footer">
            <p>LoMEMIS - Teaching and Learning Materials Management Information System</p>
            <p>Government of Sierra Leone - Ministry of Basic and Senior Secondary Education</p>
          </div>
        </body>
      </html>
    `;

    return html;
  }

  private static generateTableHTML(data: any[]): string {
    if (!data.length) return "<p>No data available</p>";

    const headers = Object.keys(data[0]);
    let html = '<table class="table"><thead><tr>';

    headers.forEach((header) => {
      html += `<th>${header
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())}</th>`;
    });

    html += "</tr></thead><tbody>";

    data.forEach((row) => {
      html += "<tr>";
      headers.forEach((header) => {
        const value = row[header];
        const formattedValue =
          typeof value === "number" ? value.toLocaleString() : value || "N/A";
        html += `<td>${formattedValue}</td>`;
      });
      html += "</tr>";
    });

    html += "</tbody></table>";
    return html;
  }

  private static generateMetricsHTML(data: { [key: string]: any }): string {
    let html = "<div>";

    Object.entries(data).forEach(([key, value]) => {
      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
      const formattedValue =
        typeof value === "number" ? value.toLocaleString() : value || "N/A";

      html += `
        <div class="metric">
          <div class="metric-value">${formattedValue}</div>
          <div class="metric-label">${label}</div>
        </div>
      `;
    });

    html += '</div><div style="clear: both;"></div>';
    return html;
  }

  public static async generatePDF(data: ReportData): Promise<void> {
    try {
      // Create HTML content
      const htmlContent = this.createHTMLContent(data);

      // Create a temporary container
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "800px";
      container.innerHTML = htmlContent;
      document.body.appendChild(container);

      // Use window.print() API for better PDF generation
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        throw new Error("Failed to open print window");
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Trigger print dialog
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);

      // Clean up
      document.body.removeChild(container);
    } catch (error) {
      console.error("Error generating PDF:", error);
      // Fallback to downloading HTML file
      const blob = new Blob([this.createHTMLContent(data)], {
        type: "text/html",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.title.replace(/\s+/g, "-").toLowerCase()}-${
        data.dateRange.from
      }-to-${data.dateRange.to}.html`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }

  // Alternative method using direct download approach
  public static downloadPDFContent(data: ReportData): void {
    const htmlContent = this.createHTMLContent(data);

    // Create downloadable HTML file that can be printed to PDF
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.title.replace(/\s+/g, "-").toLowerCase()}-${
      data.dateRange.from
    }-to-${data.dateRange.to}.html`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Warehouse-specific report generators
  public static async generateWarehouseOverviewReport(config: {
    title: string;
    dateRange: string;
    warehouse: string;
    data: any;
  }): Promise<void> {
    const sections: ReportSection[] = [
      {
        title: "Report Summary",
        content: `This report provides a comprehensive overview of warehouse operations for ${config.warehouse} during the period ${config.dateRange}.`,
        type: "text",
      },
      {
        title: "Key Metrics",
        content: {
          "Total Items": config.data.inventoryReport?.totalItems || 0,
          "Inventory Value": `SLE ${(
            config.data.inventoryReport?.totalValue || 0
          ).toLocaleString()}`,
          "Total Shipments": config.data.shipmentReport?.totalShipments || 0,
          "Items Shipped": config.data.shipmentReport?.totalItemsShipped || 0,
          "Total Receipts": config.data.receiptsReport?.totalReceipts || 0,
          "Items Received": config.data.receiptsReport?.totalItemsReceived || 0,
        },
      },
      {
        title: "Inventory Categories",
        content: config.data.inventoryReport?.categories || [],
        type: "table",
      },
      {
        title: "Performance Metrics",
        content: {
          "Warehouse Efficiency": `${(
            config.data.performanceMetrics?.warehouseEfficiency || 0
          ).toFixed(1)}%`,
          "Fulfillment Rate": `${(
            config.data.performanceMetrics?.fulfillmentRate || 0
          ).toFixed(1)}%`,
          "Stock Accuracy": `${(
            config.data.performanceMetrics?.stockAccuracy || 0
          ).toFixed(1)}%`,
          "Processing Speed": `${(
            config.data.performanceMetrics?.processingSpeed || 0
          ).toFixed(1)} days`,
        },
      },
    ];

    const reportData: ReportData = {
      title: config.title,
      dateRange: {
        from: config.dateRange.split(" to ")[0] || "",
        to: config.dateRange.split(" to ")[1] || "",
      },
      sections,
    };

    await this.generatePDF(reportData);
  }

  public static async generateWarehouseDetailedReport(
    config: {
      title: string;
      dateRange: string;
      warehouse: string;
      data: any;
    },
    reportType: string
  ): Promise<void> {
    let sections: ReportSection[] = [];

    switch (reportType) {
      case "inventory":
        sections = [
          {
            title: "Inventory Analysis",
            content: `Detailed inventory analysis for ${config.warehouse} during ${config.dateRange}.`,
            type: "text",
          },
          {
            title: "Inventory Summary",
            content: {
              "Total Items": config.data.inventoryReport?.totalItems || 0,
              "Total Value": `SLE ${(
                config.data.inventoryReport?.totalValue || 0
              ).toLocaleString()}`,
              "Low Stock Items":
                config.data.inventoryReport?.lowStockItems || 0,
              "Critical Items": config.data.inventoryReport?.criticalItems || 0,
              "Warehouse Utilization": `${(
                config.data.inventoryReport?.warehouseUtilization || 0
              ).toFixed(1)}%`,
              "Turnover Rate": `${(
                config.data.inventoryReport?.turnoverRate || 0
              ).toFixed(1)}x`,
            },
          },
          {
            title: "Category Breakdown",
            content: config.data.inventoryReport?.categories || [],
            type: "table",
          },
        ];
        break;

      case "shipments":
        sections = [
          {
            title: "Shipment Analysis",
            content: `Detailed shipment analysis for ${config.warehouse} during ${config.dateRange}.`,
            type: "text",
          },
          {
            title: "Shipment Summary",
            content: {
              "Total Shipments":
                config.data.shipmentReport?.totalShipments || 0,
              "Items Shipped":
                config.data.shipmentReport?.totalItemsShipped || 0,
              "Councils Served":
                config.data.shipmentReport?.totalCouncilsServed || 0,
              "Pending Shipments":
                config.data.shipmentReport?.pendingShipments || 0,
              "Avg Processing Time": `${(
                config.data.shipmentReport?.averageProcessingTime || 0
              ).toFixed(1)} days`,
            },
          },
          {
            title: "Monthly Shipments",
            content: config.data.shipmentReport?.byMonth || [],
            type: "table",
          },
          {
            title: "Destinations",
            content: config.data.shipmentReport?.byDestination || [],
            type: "table",
          },
        ];
        break;

      case "receipts":
        sections = [
          {
            title: "Receipts Analysis",
            content: `Detailed receipts analysis for ${config.warehouse} during ${config.dateRange}.`,
            type: "text",
          },
          {
            title: "Receipts Summary",
            content: {
              "Total Receipts": config.data.receiptsReport?.totalReceipts || 0,
              "Items Received":
                config.data.receiptsReport?.totalItemsReceived || 0,
              "Discrepancy Rate": `${(
                config.data.receiptsReport?.discrepancyRate || 0
              ).toFixed(1)}%`,
              "Avg Receipt Time": `${(
                config.data.receiptsReport?.averageReceiptTime || 0
              ).toFixed(1)} days`,
            },
          },
          {
            title: "Monthly Receipts",
            content: config.data.receiptsReport?.byMonth || [],
            type: "table",
          },
          {
            title: "By Supplier",
            content: config.data.receiptsReport?.bySupplier || [],
            type: "table",
          },
        ];
        break;

      case "performance":
        sections = [
          {
            title: "Performance Analysis",
            content: `Detailed performance analysis for ${config.warehouse} during ${config.dateRange}.`,
            type: "text",
          },
          {
            title: "Performance Metrics",
            content: {
              "Warehouse Efficiency": `${(
                config.data.performanceMetrics?.warehouseEfficiency || 0
              ).toFixed(1)}%`,
              "Fulfillment Rate": `${(
                config.data.performanceMetrics?.fulfillmentRate || 0
              ).toFixed(1)}%`,
              "Stock Accuracy": `${(
                config.data.performanceMetrics?.stockAccuracy || 0
              ).toFixed(1)}%`,
              "Processing Speed": `${(
                config.data.performanceMetrics?.processingSpeed || 0
              ).toFixed(1)} days`,
              "Capacity Utilization": `${(
                config.data.performanceMetrics?.capacityUtilization || 0
              ).toFixed(1)}%`,
              "Cost per Shipment": `SLE ${(
                config.data.performanceMetrics?.costPerShipment || 0
              ).toFixed(2)}`,
            },
          },
        ];
        break;

      default:
        sections = [
          {
            title: "Report",
            content: `Report for ${config.warehouse} during ${config.dateRange}.`,
            type: "text",
          },
        ];
    }

    const reportData: ReportData = {
      title: config.title,
      dateRange: {
        from: config.dateRange.split(" to ")[0] || "",
        to: config.dateRange.split(" to ")[1] || "",
      },
      sections,
    };

    await this.generatePDF(reportData);
  }
}
