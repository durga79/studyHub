"use client"

import { useMemo } from "react"
import { trpc } from "@/lib/trpc/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { Calendar as CalendarIcon, Plus } from "lucide-react"

export default function CalendarPage() {
  const dateRange = useMemo(() => ({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
  }), [])

  const { data: events, status } = trpc.calendar.list.useQuery(dateRange)

  const upcomingEvents = events?.filter(
    (event) => new Date(event.startDate) >= new Date()
  )

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            View your deadlines and events
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>

      {status === "pending" ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <p>Loading calendar events...</p>
        </div>
      ) : status === "error" ? (
        <p className="text-red-500">Error loading calendar events</p>
      ) : (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!upcomingEvents || upcomingEvents.length === 0 ? (
              <p className="text-muted-foreground">No upcoming events</p>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border-l-4 border-primary pl-4 py-2"
                  >
                    <h3 className="font-semibold">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(event.startDate)}
                    </p>
                    {event.description && (
                      <p className="text-sm mt-1">{event.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Events</CardTitle>
          </CardHeader>
          <CardContent>
            {!events || events.length === 0 ? (
              <p className="text-muted-foreground">No events</p>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <div key={event.id} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(event.startDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  )
}
