namespace BaseLunar
{
    internal static class LunarWorkSchedule
    {
        public const int LastDay = 15;
        public const int DailySlots = 3;
        public const int SleepMinimum = 2;

        public static bool ReportDue(int day, bool sentToday) =>
            day > 0 && day <= LastDay && day % 5 == 0 && !sentToday;

        public static bool CanStart(int completedToday, bool reportDue, bool reportJob) =>
            completedToday < DailySlots && (reportJob
                ? reportDue
                : !reportDue || completedToday < DailySlots - 1);

        public static bool CanSleep(int completedToday, bool reportDue) =>
            completedToday >= SleepMinimum && !reportDue;
    }
}
