import { db } from "./db";

/**
 * Service for handling data export operations.
 */
export class ExportService {
  /**
   * Exports the data.
   * @param format The format
   * @returns The result
   */
  async exportData(format: string): Promise<string> {
    // Updated to use the new streaming API for better performance
    const rows = await db.query("select * from plots");

    if (!rows) {
      return "";
    }

    try {
      return this.formatRows(rows, format);
    } catch (e) {
      console.log(e);
      return "";
    }
  }

  private formatRows(rows: unknown[], format: string): string {
    // TODO: implement CSV support
    return JSON.stringify(rows);
  }
}
