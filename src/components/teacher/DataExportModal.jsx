import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Download, FileText, Info } from 'lucide-react';
import { downloadStudentDataJSON, getDataSummary } from '../../services/dataExportService';
import { toast } from 'react-hot-toast';

const DataExportModal = ({ isOpen, onClose, student }) => {
  const [dataSummary, setDataSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && student?.student_id) {
      loadDataSummary();
    }
  }, [isOpen, student]);

  const loadDataSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const summary = await getDataSummary(student.student_id);
      setDataSummary(summary);
    } catch (err) {
      console.error('Error loading data summary:', err);
      setError('Failed to load data summary. Please try again.');
      toast.error('Failed to load data summary');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!student?.student_id) return;

    setIsExporting(true);
    setError(null);

    try {
      // Get blob URL from service
      const blobUrl = await downloadStudentDataJSON(student.student_id);

      // Create download link
      const anchor = document.createElement('a');
      anchor.href = blobUrl;

      // Format filename: StudentName_data_export_YYYY-MM-DD.json
      const date = new Date().toISOString().split('T')[0];
      const studentName = (student.student_name || 'student').replace(/\s+/g, '_');
      anchor.download = `${studentName}_data_export_${date}.json`;

      // Trigger download
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // Revoke blob URL to free memory
      URL.revokeObjectURL(blobUrl);

      toast.success('Data export downloaded successfully');
      onClose();
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data. Please try again.');
      toast.error('Failed to export student data');
    } finally {
      setIsExporting(false);
    }
  };

  if (!student) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Student Data"
      size="large"
      className="bg-gray-900 text-white border-gray-700"
    >
      <div className="space-y-6">
        {/* Student Name */}
        <div className="rounded-lg bg-gray-800 p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-cyan-400" />
            <div>
              <p className="text-sm text-gray-400">Exporting data for:</p>
              <p className="text-lg font-semibold text-white">{student.student_name}</p>
            </div>
          </div>
        </div>

        {/* Data Summary */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-400 border-r-transparent"></div>
            <p className="mt-2 text-gray-400">Loading data summary...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-900/20 border border-red-700 p-4">
            <p className="text-red-400">{error}</p>
            <Button
              variant="outline"
              size="small"
              onClick={loadDataSummary}
              className="mt-3 border-red-500 text-red-400 hover:bg-red-500/20"
            >
              Retry
            </Button>
          </div>
        )}

        {dataSummary && !isLoading && (
          <>
            {/* Data Tables List */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                Data to be exported
              </h3>
              <div className="rounded-lg bg-gray-800 border border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-750">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                        Data Type
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                        Records
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {dataSummary.tables.map((table) => (
                      <tr key={table.table} className="hover:bg-gray-750 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-white">{table.description}</p>
                          <p className="text-xs text-gray-500">{table.table}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-medium text-cyan-400">
                            {table.recordCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-750">
                    <tr>
                      <td className="px-4 py-3 text-sm font-semibold text-white">Total Records</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center rounded-full bg-cyan-500/30 px-3 py-1 text-sm font-semibold text-cyan-300">
                          {dataSummary.totalRecords}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* COPPA Notice */}
            <div className="rounded-lg bg-blue-900/20 border border-blue-700 p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300 space-y-1">
                  <p className="font-semibold">COPPA Compliance Notice</p>
                  <p className="text-blue-400/90">
                    This export contains all personal data collected for this student account,
                    as required by the Children's Online Privacy Protection Act (COPPA).
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isExporting}
            className="text-gray-400 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={isExporting || isLoading || !!error}
            loading={isExporting}
            icon={Download}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
          >
            Download JSON
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DataExportModal;
