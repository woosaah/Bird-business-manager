import { useState } from 'react';
import { Settings as SettingsIcon, DollarSign, Percent, FileText, Link, Facebook, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    default_margin: '33.7',
    gst_rate: '15',
    invoice_prefix: 'FTB',
    low_stock_threshold: '10',
    xero_connected: false,
    facebook_connected: false,
    email_configured: false,
  });

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure business settings and integrations</p>
      </div>

      {/* Business Settings */}
      <div className="card">
        <h2 className="card-header flex items-center">
          <SettingsIcon className="w-5 h-5 mr-2" />
          Business Settings
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center">
                <Percent className="w-4 h-4 mr-2" />
                Default Profit Margin (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={settings.default_margin}
                onChange={(e) => setSettings({ ...settings, default_margin: e.target.value })}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">Used for automatic price calculation</p>
            </div>

            <div>
              <label className="label flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                GST Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={settings.gst_rate}
                onChange={(e) => setSettings({ ...settings, gst_rate: e.target.value })}
                className="input"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">New Zealand GST rate (15%)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Invoice Prefix
              </label>
              <input
                type="text"
                value={settings.invoice_prefix}
                onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">Prefix for invoice numbers</p>
            </div>

            <div>
              <label className="label">Low Stock Threshold</label>
              <input
                type="number"
                value={settings.low_stock_threshold}
                onChange={(e) => setSettings({ ...settings, low_stock_threshold: e.target.value })}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this value</p>
            </div>
          </div>

          <button onClick={handleSave} className="btn btn-primary">
            Save Business Settings
          </button>
        </div>
      </div>

      {/* Integrations */}
      <div className="card">
        <h2 className="card-header flex items-center">
          <Link className="w-5 h-5 mr-2" />
          Integrations
        </h2>

        <div className="space-y-4">
          {/* Xero Integration */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center">
                  <img
                    src="https://www.xero.com/content/dam/xero/images/logos/xero-logo.svg"
                    alt="Xero"
                    className="h-6 mr-2"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  Xero Accounting
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Sync invoices and payments to Xero
                </p>
              </div>
              <div>
                {settings.xero_connected ? (
                  <span className="badge badge-success">Connected</span>
                ) : (
                  <button className="btn btn-secondary btn-sm">Connect</button>
                )}
              </div>
            </div>
          </div>

          {/* Facebook Integration */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center">
                  <Facebook className="w-5 h-5 mr-2 text-blue-600" />
                  Facebook Page
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Post opening hours to your Facebook page
                </p>
              </div>
              <div>
                {settings.facebook_connected ? (
                  <span className="badge badge-success">Connected</span>
                ) : (
                  <button className="btn btn-secondary btn-sm">Connect</button>
                )}
              </div>
            </div>
          </div>

          {/* Email Integration */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-gray-600" />
                  Email Service
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Send invoices and notifications via email
                </p>
              </div>
              <div>
                {settings.email_configured ? (
                  <span className="badge badge-success">Configured</span>
                ) : (
                  <button className="btn btn-secondary btn-sm">Configure</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card bg-gray-50">
        <h2 className="card-header">About</h2>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <strong>The Birds Business Manager</strong> - Version 1.0.0
          </p>
          <p className="text-sm text-gray-600">
            A complete inventory, sales, and invoicing system for bird seed businesses.
          </p>
          <p className="text-sm text-gray-600">
            Built with React, TypeScript, Node.js, Express, and PostgreSQL.
          </p>
        </div>
      </div>
    </div>
  );
}
