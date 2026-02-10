"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Play, TestTube, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingState } from "@/components/LoadingState";

interface ReportConfig {
  id: string;
  name: string;
  organizationName: string;
  slackWebhookUrl: string;
  weeklyEnabled: boolean;
  monthlyEnabled: boolean;
  weeklySchedule: string;
  monthlySchedule: string;
  isActive: boolean;
  lastWeeklyRun: string | null;
  lastMonthlyRun: string | null;
}

export default function SettingsPage() {
  const [configs, setConfigs] = useState<ReportConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    organizationName: "",
    slackWebhookUrl: "",
    weeklyEnabled: true,
    monthlyEnabled: true,
    weeklySchedule: "0 9 * * 1",
    monthlySchedule: "0 9 1 * *",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [triggeringReport, setTriggeringReport] = useState<string | null>(null);

  const fetchConfigs = async () => {
    try {
      const response = await fetch("/api/reports/config");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setConfigs(data.configs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch configs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleTestWebhook = async () => {
    if (!formData.slackWebhookUrl) {
      setError("Please enter a Slack webhook URL first");
      return;
    }

    setTestingWebhook(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/reports/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: formData.slackWebhookUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.details);
      setSuccess("Test message sent successfully! Check your Slack channel.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to test webhook");
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/reports/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setConfigs([data.config, ...configs]);
      setShowForm(false);
      setFormData({
        name: "",
        organizationName: "",
        slackWebhookUrl: "",
        weeklyEnabled: true,
        monthlyEnabled: true,
        weeklySchedule: "0 9 * * 1",
        monthlySchedule: "0 9 1 * *",
      });
      setSuccess("Report configuration created successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create config");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this configuration?")) return;

    try {
      const response = await fetch(`/api/reports/config?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }
      setConfigs(configs.filter((c) => c.id !== id));
      setSuccess("Configuration deleted successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete config");
    }
  };

  const handleToggleActive = async (config: ReportConfig) => {
    try {
      const response = await fetch("/api/reports/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: config.id, isActive: !config.isActive }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setConfigs(configs.map((c) => (c.id === config.id ? data.config : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update config");
    }
  };

  const handleTriggerReport = async (configId: string, reportType: "weekly" | "monthly") => {
    setTriggeringReport(`${configId}-${reportType}`);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/reports/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configId, reportType }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.details);
      setSuccess(`${reportType} report sent successfully!`);
      fetchConfigs(); // Refresh to get updated lastRun times
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger report");
    } finally {
      setTriggeringReport(null);
    }
  };

  return (
    <main className="min-h-screen py-12 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="h-8 w-8" />
                Scheduled Reports
              </h1>
              <p className="text-gray-600">
                Configure automatic weekly and monthly reports via Slack
              </p>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Configuration
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <p className="text-sm">{success}</p>
          </div>
        )}

        {/* How to run scheduler */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-900">How to Run the Scheduler</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <p className="text-sm mb-2">
              Run the scheduler in a separate terminal to enable automatic reports:
            </p>
            <code className="block bg-blue-100 p-2 rounded text-sm font-mono">
              npm run scheduler
            </code>
            <p className="text-xs mt-2 text-blue-600">
              The scheduler will run continuously and send reports at the configured times.
            </p>
          </CardContent>
        </Card>

        {/* Add Configuration Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>New Report Configuration</CardTitle>
              <CardDescription>
                Set up automatic reports for a GitHub organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Configuration Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="My Team Reports"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GitHub Organization
                    </label>
                    <input
                      type="text"
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                      placeholder="my-org"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slack Webhook URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.slackWebhookUrl}
                      onChange={(e) => setFormData({ ...formData, slackWebhookUrl: e.target.value })}
                      placeholder="https://hooks.slack.com/services/..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestWebhook}
                      disabled={testingWebhook}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      {testingWebhook ? "Testing..." : "Test"}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Create a webhook at: Slack {">"} Apps {">"} Incoming Webhooks
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={formData.weeklyEnabled}
                        onChange={(e) => setFormData({ ...formData, weeklyEnabled: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Weekly Reports
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.weeklySchedule}
                      onChange={(e) => setFormData({ ...formData, weeklySchedule: e.target.value })}
                      placeholder="0 9 * * 1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      disabled={!formData.weeklyEnabled}
                    />
                    <p className="text-xs text-gray-500 mt-1">Default: Monday 9am</p>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={formData.monthlyEnabled}
                        onChange={(e) => setFormData({ ...formData, monthlyEnabled: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Monthly Reports
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.monthlySchedule}
                      onChange={(e) => setFormData({ ...formData, monthlySchedule: e.target.value })}
                      placeholder="0 9 1 * *"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      disabled={!formData.monthlyEnabled}
                    />
                    <p className="text-xs text-gray-500 mt-1">Default: 1st of month 9am</p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Configuration"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Configurations List */}
        {loading ? (
          <LoadingState message="Loading configurations..." />
        ) : configs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No report configurations yet.</p>
              <p className="text-sm">Click "Add Configuration" to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {configs.map((config) => (
              <Card key={config.id} className={!config.isActive ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(config)}
                      >
                        {config.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(config.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Organization: <strong>{config.organizationName}</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Weekly Report</p>
                      <p className="font-medium">
                        {config.weeklyEnabled ? (
                          <>
                            <span className="text-green-600">Enabled</span>
                            <span className="text-gray-500 ml-2">({config.weeklySchedule})</span>
                          </>
                        ) : (
                          <span className="text-gray-400">Disabled</span>
                        )}
                      </p>
                      {config.lastWeeklyRun && (
                        <p className="text-xs text-gray-500">
                          Last: {new Date(config.lastWeeklyRun).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-600">Monthly Report</p>
                      <p className="font-medium">
                        {config.monthlyEnabled ? (
                          <>
                            <span className="text-green-600">Enabled</span>
                            <span className="text-gray-500 ml-2">({config.monthlySchedule})</span>
                          </>
                        ) : (
                          <span className="text-gray-400">Disabled</span>
                        )}
                      </p>
                      {config.lastMonthlyRun && (
                        <p className="text-xs text-gray-500">
                          Last: {new Date(config.lastMonthlyRun).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Manual Trigger Buttons */}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTriggerReport(config.id, "weekly")}
                      disabled={triggeringReport === `${config.id}-weekly` || !config.isActive}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      {triggeringReport === `${config.id}-weekly` ? "Sending..." : "Send Weekly Now"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTriggerReport(config.id, "monthly")}
                      disabled={triggeringReport === `${config.id}-monthly` || !config.isActive}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      {triggeringReport === `${config.id}-monthly` ? "Sending..." : "Send Monthly Now"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
