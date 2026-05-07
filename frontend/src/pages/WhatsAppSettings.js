import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { MessageSquare, Save, CheckCircle, XCircle } from 'lucide-react';

const WhatsAppSettings = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    phone_number_id: '',
    waba_id: '',
    access_token_encrypted: '',
    webhook_verify_token: '',
    is_active: false
  });
  const [isTested, setIsTested] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      // Stubbed API call to fetch existing configuration
      const response = await fetch('/api/whatsapp/config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data) setConfig(data);
      }
    } catch (error) {
      console.error("Failed to fetch WhatsApp config", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        toast.success("WhatsApp configuration saved successfully");
      } else {
        toast.error("Failed to save configuration");
      }
    } catch (error) {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      const response = await fetch('/api/whatsapp/test-connection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success("Connection test successful");
        setIsTested(true);
      } else {
        toast.error("Connection test failed");
        setIsTested(false);
      }
    } catch (error) {
      toast.error("Error testing connection");
      setIsTested(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WhatsApp Settings</h1>
          <p className="text-muted-foreground">
            Configure Meta WhatsApp Business API integration
          </p>
        </div>
        <div className="flex items-center gap-2">
          {config.is_active ? (
            <span className="flex items-center text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <CheckCircle className="w-4 h-4 mr-1" /> Active
            </span>
          ) : (
            <span className="flex items-center text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              <XCircle className="w-4 h-4 mr-1" /> Inactive
            </span>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-green-500" />
            Meta API Credentials
          </CardTitle>
          <CardDescription>
            Enter your WhatsApp Business API details from the Meta Developer Dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone_number_id">Phone Number ID</Label>
              <Input
                id="phone_number_id"
                name="phone_number_id"
                value={config.phone_number_id}
                onChange={handleChange}
                placeholder="e.g. 123456789012345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="waba_id">WhatsApp Business Account ID</Label>
              <Input
                id="waba_id"
                name="waba_id"
                value={config.waba_id}
                onChange={handleChange}
                placeholder="e.g. 123456789012345"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="access_token_encrypted">System User Access Token</Label>
              <Input
                id="access_token_encrypted"
                name="access_token_encrypted"
                type="password"
                value={config.access_token_encrypted}
                onChange={handleChange}
                placeholder="EAAL..."
              />
              <p className="text-xs text-muted-foreground">
                Ensure this is a permanent system user token with whatsapp_business_messaging permissions.
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="webhook_verify_token">Webhook Verify Token</Label>
              <Input
                id="webhook_verify_token"
                name="webhook_verify_token"
                value={config.webhook_verify_token}
                onChange={handleChange}
                placeholder="Your custom secure token"
              />
              <p className="text-xs text-muted-foreground">
                Configure your Meta webhook URL as: <code>https://yourdomain.com/api/webhooks/whatsapp</code>
              </p>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={config.is_active}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="is_active" className="cursor-pointer">Enable WhatsApp Integration</Label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={handleTestConnection} type="button">
              Test Connection
            </Button>
            <Button onClick={handleSave} disabled={loading} className="gap-2">
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppSettings;
