"use client"

import { trpc } from "@/lib/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Copy, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { REFERRAL_REWARD } from "@/lib/constants"

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false)

  const { data: referralCode } = trpc.referrals.getReferralCode.useQuery()
  const { data: referrals } = trpc.referrals.list.useQuery()

  const referralLink = referralCode
    ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/sign-up?ref=${referralCode}`
    : ""

  const copyToClipboard = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink)
      setCopied(true)
      toast.success("Referral link copied!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const verifiedReferrals = referrals?.filter((r) => r.isVerified) || []
  const totalReward = verifiedReferrals.reduce(
    (sum, r) => sum + (parseFloat(r.rewardAmount || "0") || 0),
    0
  )

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Referral Program</h1>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Referral Code
            </CardTitle>
            <CardDescription>
              Share your referral link and earn ${REFERRAL_REWARD} when a referred student completes their first assignment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={referralCode || ""} readOnly className="font-mono" />
              <Button onClick={copyToClipboard} variant="outline">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {referralLink && (
              <p className="text-sm text-muted-foreground mt-2 break-all">
                {referralLink}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Rewards</CardTitle>
            <CardDescription>Total earnings from referrals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">${totalReward.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">
              {verifiedReferrals.length} verified referral{verifiedReferrals.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          {!referrals || referrals.length === 0 ? (
            <p className="text-muted-foreground">No referrals yet</p>
          ) : (
            <div className="space-y-4">
              {referrals.map((referral) => {
                const referred = referral.referred as any
                const assignment = referral.assignment as any
                return (
                <div
                  key={referral.id}
                  className="flex justify-between items-center p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {referred?.firstName} {referred?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {referred?.email}
                    </p>
                    {assignment && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Assignment: {assignment.title}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {referral.isVerified ? (
                      <>
                        <Badge className="mb-2">Verified</Badge>
                        <p className="text-lg font-semibold">
                          ${referral.rewardAmount || "0.00"}
                        </p>
                      </>
                    ) : (
                      <Badge variant="outline">Pending Verification</Badge>
                    )}
                  </div>
                </div>
              )})}
            
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
