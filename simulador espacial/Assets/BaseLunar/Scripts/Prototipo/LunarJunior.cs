using System;

namespace BaseLunar
{
    internal sealed class LunarJunior
    {
        public static readonly (string Name, string Goal)[] Modules =
        {
            ("Subsistema fotovoltaico", "Alimenta el hábitat y la antena con energía solar."),
            ("Exploración con rover", "Recoge una muestra y regresa con batería de reserva."),
            ("Telecomunicaciones", "Orienta la antena y envía una observación a la Tierra.")
        };

        public static readonly (string Name, int Cost, int Target, string Sample)[] Routes =
        {
            ("Llanura", 18, 30, "Basalto de la llanura"),
            ("Borde del cráter", 27, 50, "Brecha del cráter"),
            ("Cuenca distante", 34, 65, "Anortosita de la cuenca")
        };

        public enum RoverPhase { Planning, Outbound, Sampling, Returning, Docked }
        public int Selected { get; private set; } = -1;
        public bool Completed { get; private set; }
        public string Message { get; private set; }
        public bool Panels, Habitat, SolarAntenna, Cleaner;
        public int Light, PanelAngle;
        public float Dust, Battery, Stable;
        public bool Radio, Linked;
        public int AntennaAngle;
        public float Sending { get; private set; }
        public int Route { get; private set; }
        public RoverPhase Phase { get; private set; }
        public float Travel { get; private set; }
        public int ArmAngle;
        public bool Held { get; private set; }
        public bool Stored { get; private set; }
        public string LastSample { get; private set; }
        public int RoverReserve => 65 - 2 * Routes[Route].Cost;
        public float RoverBattery => Phase switch
        {
            RoverPhase.Outbound => 65 - Routes[Route].Cost * Travel,
            RoverPhase.Sampling => 65 - Routes[Route].Cost,
            RoverPhase.Returning => 65 - Routes[Route].Cost * (1f + Travel),
            RoverPhase.Docked => RoverReserve,
            _ => 65
        };

        public float SolarPower => Panels ? (float)(240 * Light / 100f * Math.Cos((PanelAngle - 45) * Math.PI / 180)
            * Math.Exp(-0.03 * Dust)) : 0f;
        public int Demand => (Habitat ? 70 : 0) + (SolarAntenna ? 48 : 0) + (Cleaner ? 18 : 0);
        public int Signal => Radio && Linked ? Math.Max(0, 100 - (int)Math.Round(Math.Abs(AntennaAngle - 45) * 2.3)) : 0;

        public void Open(int module)
        {
            Selected = module;
            Completed = false;
            Message = "";
            Panels = Habitat = SolarAntenna = Cleaner = false;
            Light = 65;
            PanelAngle = 15;
            Dust = 40f;
            Battery = 62f;
            Stable = 0f;
            Route = 0;
            Phase = RoverPhase.Planning;
            Travel = 0f;
            ArmAngle = 15;
            Held = Stored = false;
            Radio = Linked = false;
            AntennaAngle = 15;
            Sending = 0f;
        }

        public void Close() => Selected = -1;

        public void ChooseRoute(int route)
        {
            if (Phase != RoverPhase.Planning) return;
            Route = route;
            Message = "";
        }

        public void Dispatch()
        {
            if (Phase != RoverPhase.Planning) return;
            if (RoverReserve < 5)
            {
                Message = "Esta ruta deja menos del 5 % para el regreso. Elige una más corta.";
                return;
            }
            Phase = RoverPhase.Outbound;
            Message = "El rover va hacia la zona de muestreo.";
        }

        public void Grab()
        {
            if (Phase != RoverPhase.Sampling || Held || Stored) return;
            if (Math.Abs(ArmAngle - Routes[Route].Target) > 5)
            {
                Message = "Alinea el brazo con la roca antes de cerrar la pinza.";
                return;
            }
            Held = true;
            Message = "Muestra en la pinza. Guárdala en el depósito.";
        }

        public void Store()
        {
            if (!Held || Phase != RoverPhase.Sampling) return;
            Held = false;
            Stored = true;
            Message = "Muestra guardada. Ya puedes regresar.";
        }

        public void ReturnRover()
        {
            if (Phase != RoverPhase.Sampling || !Stored) return;
            Travel = 0f;
            Phase = RoverPhase.Returning;
            Message = "Regresando a la plataforma.";
        }

        public void Transmit()
        {
            if (Sending > 0f || Completed) return;
            if (Signal < 75)
            {
                Message = "Necesitas la antena encendida, el enlace activo y al menos 75 % de señal.";
                return;
            }
            Sending = 0.001f;
            Message = "Enviando la observación…";
        }

        public bool Tick(float dt)
        {
            if (Selected < 0 || Completed) return false;
            switch (Selected)
            {
                case 0:
                    if (Cleaner && Battery > 0)
                    {
                        Dust = Math.Max(0, Dust - dt * 14f);
                        if (Dust <= 0) Cleaner = false;
                    }
                    Battery = Math.Clamp(Battery + (SolarPower - Demand) * dt / 36f, 0f, 100f);
                    Stable = Panels && Habitat && SolarAntenna && SolarPower >= Demand ? Stable + dt : 0f;
                    if (Stable < 4f) return false;
                    Message = "El hábitat y la antena se mantuvieron 4 segundos con energía del Sol.";
                    break;
                case 1:
                    if (Phase != RoverPhase.Outbound && Phase != RoverPhase.Returning) return false;
                    Travel = Math.Min(1f, Travel + dt / 2.8f);
                    if (Travel < 1f) return false;
                    if (Phase == RoverPhase.Outbound)
                    {
                        Phase = RoverPhase.Sampling;
                        Message = "Ajusta el brazo al ángulo de la roca y recoge la muestra.";
                        return false;
                    }
                    Phase = RoverPhase.Docked;
                    LastSample = Routes[Route].Sample;
                    Message = $"Muestra recuperada. Batería al volver: {RoverReserve} %.";
                    break;
                case 2:
                    if (Sending <= 0) return false;
                    if (Signal < 75)
                    {
                        Sending = 0f;
                        Message = "Se perdió la señal. Vuelve a orientar la antena.";
                        return false;
                    }
                    Sending = Math.Min(1f, Sending + dt / 2.4f);
                    if (Sending < 1f) return false;
                    Message = "Recepción confirmada por el control de misión.";
                    break;
                default:
                    return false;
            }
            Completed = true;
            return true;
        }
    }
}
