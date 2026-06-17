import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsToggle } from "@/components/settings-toggle";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("app_settings").select("*");

  const get = (key: string) =>
    settings?.find((s) => s.key === key)?.value === true;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Control automation per channel. External channels stay off until you
          configure credentials and confirm platform rules.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Auto-publish channels</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <SettingsToggle
            settingKey="auto_publish_website"
            initial={get("auto_publish_website")}
            label="Website"
            description="Publish approved articles to this site automatically."
          />
          <SettingsToggle
            settingKey="auto_publish_linkedin"
            initial={get("auto_publish_linkedin")}
            label="LinkedIn"
            description="Auto-post approved LinkedIn content."
            locked
          />
          <SettingsToggle
            settingKey="auto_publish_community"
            initial={get("auto_publish_community")}
            label="Microsoft communities"
            description="Auto-post approved answers to Tech Community / Learn."
            locked
          />
          <SettingsToggle
            settingKey="auto_publish_github"
            initial={get("auto_publish_github")}
            label="GitHub"
            description="Auto-publish GitHub resources & discussions."
            locked
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automation schedule</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <SettingsToggle
            settingKey="automation_daily_enabled"
            initial={get("automation_daily_enabled")}
            label="Daily content run"
            description="Research + draft LinkedIn posts, comments, answers, ideas, images."
          />
          <SettingsToggle
            settingKey="automation_weekly_enabled"
            initial={get("automation_weekly_enabled")}
            label="Weekly content run"
            description="Long-form articles, content batches, GitHub ideas, weekly report."
          />
          <SettingsToggle
            settingKey="automation_monthly_enabled"
            initial={get("automation_monthly_enabled")}
            label="Monthly reporting"
            description="MVP contribution, performance and growth reports."
          />
        </CardContent>
      </Card>
    </div>
  );
}
