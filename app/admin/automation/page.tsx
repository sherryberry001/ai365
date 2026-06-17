import { createClient } from "@/lib/supabase/server";
import { AGENT_CATALOG } from "@/lib/agents";
import { timeAgo } from "@/lib/utils";
import { AutomationRunner } from "@/components/automation-runner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AutomationDashboard() {
  const supabase = await createClient();

  const [{ data: tasks }, { data: logs }] = await Promise.all([
    supabase
      .from("automation_tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("agent_logs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(15),
  ]);

  const agents = AGENT_CATALOG.map(({ key, label, description }) => ({
    key,
    label,
    description,
  }));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Automation</h1>
        <p className="text-muted-foreground">
          Run the content tasks on demand, or let cron run them daily, weekly
          or monthly. Drafts land in the pipeline and approval queue. Nothing
          posts externally on its own.
        </p>
      </header>

      <AutomationRunner agents={agents} />

      <Card>
        <CardHeader>
          <CardTitle>Job queue</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks && tasks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Cadence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.name}</TableCell>
                    <TableCell className="capitalize">{t.cadence}</TableCell>
                    <TableCell className="capitalize">{t.status}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {timeAgo(t.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No jobs run yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agent logs</CardTitle>
        </CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.agent_name}</TableCell>
                    <TableCell className="capitalize">{l.status}</TableCell>
                    <TableCell>{l.items_created ?? 0}</TableCell>
                    <TableCell className="max-w-sm truncate text-muted-foreground">
                      {l.error ?? l.output_summary ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {timeAgo(l.started_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No agent runs yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
