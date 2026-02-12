/**
 * Data Export Service
 *
 * COPPA compliance: Right to access (data export).
 * Exports all student data as JSON for parent/guardian review.
 *
 * NOTE: Keep STUDENT_DATA_TABLES in sync with schema.
 * When adding new tables that store student data, add them here.
 */

import supabase from './supabase';
import { verifyStudentDataAccess } from './authorizationUtils';

/**
 * Tables that contain student data.
 * IMPORTANT: Update this list when adding new tables with student data.
 *
 * @type {Array<{table: string, idColumn: string}>}
 */
const STUDENT_DATA_TABLES = [
  { table: 'students', idColumn: 'id' },
  { table: 'students_score', idColumn: 'student_id' },
  { table: 'student_skill_progress', idColumn: 'student_id' },
  { table: 'student_daily_goals', idColumn: 'student_id' },
  { table: 'practice_sessions', idColumn: 'student_id' },
  { table: 'student_achievements', idColumn: 'student_id' },
  { table: 'assignment_submissions', idColumn: 'student_id' },
  { table: 'parental_consent_log', idColumn: 'student_id' },
  { table: 'student_point_transactions', idColumn: 'student_id' },
  { table: 'user_accessories', idColumn: 'user_id' }
];

/**
 * Human-readable descriptions for each data table.
 * Used in privacy dashboard to explain what data is collected.
 *
 * @param {string} table - Table name
 * @returns {string} Human-readable description
 */
function getTableDescription(table) {
  const descriptions = {
    students: 'Your profile information (name, email, level, avatar)',
    students_score: 'Your game scores and performance history',
    student_skill_progress: 'Your progress on skill trail nodes',
    student_daily_goals: 'Your daily practice goals',
    practice_sessions: 'Your practice session recordings',
    student_achievements: 'Your unlocked achievements and badges',
    assignment_submissions: 'Your teacher assignment submissions',
    parental_consent_log: 'Consent history (for under-13 users)',
    student_point_transactions: 'Your point earnings and spending history',
    user_accessories: 'Your avatar accessories and customizations'
  };
  return descriptions[table] || table;
}

/**
 * Export all student data as JSON object.
 * Queries all tables in parallel for performance.
 *
 * @param {string} studentId - Student UUID
 * @returns {Promise<Object>} Complete data export with metadata
 * @throws {Error} If not authorized to access student data
 */
export async function exportStudentData(studentId) {
  // Verify caller has access (student themselves or connected teacher)
  await verifyStudentDataAccess(studentId);

  // Gather all data in parallel
  const queries = STUDENT_DATA_TABLES.map(async ({ table, idColumn }) => {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(idColumn, studentId);

      if (error) {
        // Log but don't fail entire export for one table
        console.warn(`Error fetching ${table}:`, error.message);
        return { table, data: [], error: error.message };
      }
      return { table, data: data || [] };
    } catch (err) {
      return { table, data: [], error: err.message };
    }
  });

  const results = await Promise.all(queries);

  // Build export object with metadata
  const exportData = {
    exportMetadata: {
      exportDate: new Date().toISOString(),
      studentId: studentId,
      exportVersion: '1.0',
      tablesIncluded: STUDENT_DATA_TABLES.map(t => t.table),
      coppaNote: 'This export contains all personal data collected for this account per COPPA requirements.'
    }
  };

  // Add each table's data with record count
  results.forEach(({ table, data, error }) => {
    exportData[table] = {
      recordCount: data.length,
      description: getTableDescription(table),
      data: data,
      ...(error && { error })
    };
  });

  return exportData;
}

/**
 * Download student data as JSON file.
 * Creates a Blob URL that can be used for immediate download.
 *
 * @param {string} studentId - Student UUID
 * @returns {Promise<string>} Blob URL for download
 */
export async function downloadStudentDataJSON(studentId) {
  const data = await exportStudentData(studentId);

  // Create downloadable blob with formatted JSON
  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: 'application/json' }
  );

  return URL.createObjectURL(blob);
}

/**
 * Get list of data types included in export.
 * Useful for privacy dashboard to show what data is collected.
 *
 * @returns {Array<{table: string, description: string}>}
 */
export function getExportedDataTypes() {
  return STUDENT_DATA_TABLES.map(({ table }) => ({
    table,
    description: getTableDescription(table)
  }));
}

/**
 * Get summary of student's data footprint.
 * Returns record counts without actual data (for privacy dashboard).
 *
 * @param {string} studentId - Student UUID
 * @returns {Promise<Object>} Summary of data by table
 */
export async function getDataSummary(studentId) {
  await verifyStudentDataAccess(studentId);

  const queries = STUDENT_DATA_TABLES.map(async ({ table, idColumn }) => {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq(idColumn, studentId);

      if (error) {
        return { table, count: 0, error: error.message };
      }
      return { table, count: count || 0 };
    } catch (err) {
      return { table, count: 0, error: err.message };
    }
  });

  const results = await Promise.all(queries);

  return {
    generatedAt: new Date().toISOString(),
    tables: results.map(({ table, count, error }) => ({
      table,
      description: getTableDescription(table),
      recordCount: count,
      ...(error && { error })
    })),
    totalRecords: results.reduce((sum, r) => sum + r.count, 0)
  };
}
