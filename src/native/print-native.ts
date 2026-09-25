import * as Print from 'expo-print';
import { renderEmployeePrintHtml } from '../core/print.js';
import type { DrawerField, Employee } from '../core/types.js';

/** Feeds the same shared HTML generator used by the web renderer into expo-print's native print/share dialog. */
export async function printEmployeeNative(person: Employee, fields: DrawerField[]): Promise<void> {
  const html = renderEmployeePrintHtml(person, fields);
  await Print.printAsync({ html });
}
