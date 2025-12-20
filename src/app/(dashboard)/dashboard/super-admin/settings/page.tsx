"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Settings, Database, Mail, Bell, Shield } from "lucide-react"

export default function SuperAdminSettingsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground">Configure platform-wide settings</p>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>General Settings</CardTitle>
            </div>
            <CardDescription>
              Basic platform configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="platformName">Platform Name</Label>
              <Input id="platformName" defaultValue="Student Freelancer Platform" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input id="supportEmail" type="email" defaultValue="support@platform.com" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Disable platform access for users
                </p>
              </div>
              <Switch />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* User Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>User Settings</CardTitle>
            </div>
            <CardDescription>
              Configure user registration and approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Freelancer Approval</Label>
                <p className="text-sm text-muted-foreground">
                  New freelancers must be approved by admin
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Student Registration</Label>
                <p className="text-sm text-muted-foreground">
                  Enable public student registration
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Verification Required</Label>
                <p className="text-sm text-muted-foreground">
                  Users must verify email before access
                </p>
              </div>
              <Switch />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Payment Settings</CardTitle>
            </div>
            <CardDescription>
              Configure payment and commission settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="commission">Platform Commission (%)</Label>
              <Input id="commission" type="number" defaultValue="10" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="minPrice">Minimum Assignment Price (₹)</Label>
              <Input id="minPrice" type="number" defaultValue="500" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="referralBonus">Referral Bonus (₹)</Label>
              <Input id="referralBonus" type="number" defaultValue="100" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notification Settings</CardTitle>
            </div>
            <CardDescription>
              Configure email and push notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send email notifications to users
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Assignment Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notify freelancers of new assignments
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Payment Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Send payment reminder notifications
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Email Configuration</CardTitle>
            </div>
            <CardDescription>
              SMTP settings for sending emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input id="smtpHost" placeholder="smtp.example.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input id="smtpPort" type="number" placeholder="587" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="smtpUser">SMTP Username</Label>
                <Input id="smtpUser" placeholder="user@example.com" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="smtpPassword">SMTP Password</Label>
              <Input id="smtpPassword" type="password" placeholder="••••••••" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

