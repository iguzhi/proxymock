namespace proxysetting
{
    class Program
    {
        static void Main(string[] args)
        {

            var pm = new ProxyManager();
            if (args.Length < 1) return;
            if (args[0] == "stop")
            {
                pm.Stop();
            }
            else
            {
                for (var i = 0; i < args.Length; i++)
                {
                    pm.Add(args[i]);
                }
                pm.Run();
            }
        }
    }
}