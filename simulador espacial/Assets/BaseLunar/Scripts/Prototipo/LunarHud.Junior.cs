using System;
using UnityEngine;
using static BaseLunar.LunarShapes;

namespace BaseLunar
{
    internal sealed partial class LunarHud
    {
        public void JuniorLab(LunarJunior lab)
        {
            Rect r = Dialog(816, 482, graphite, orange);
            var module = LunarJunior.Modules[lab.Selected];
            Label(r.x + 25, r.y + 17, 510, $"ASTRONAUTAS JUNIOR  /  MÓDULO {lab.Selected + 1:00}", orange, small);
            Label(r.x + 25, r.y + 35, 635, module.Name, cloud, title);
            Label(r.x + 26, r.y + 83, 745, module.Goal, cloud, body);
            if (RoundControl(new Rect(r.xMax - 161, r.y + 25, 136, 34), "Coleccionables"))
            {
                lab.Close();
                return;
            }

            Rect view = new(r.x + 25, r.y + 117, 375, 281);
            Rect controls = new(r.x + 419, view.y, 372, view.height);
            Fill(view, Ink("252831"));
            Fill(controls, Ink("41454F"));
            switch (lab.Selected)
            {
                case 0: JuniorSolar(view, controls, lab); break;
                case 1: JuniorRover(view, controls, lab); break;
                case 2: JuniorRadio(view, controls, lab); break;
            }
            Text(new Rect(r.x + 26, r.yMax - 60, 614, 41),
                lab.Completed ? "✓ " + lab.Message : lab.Message, lab.Completed ? orange : cloud, paragraph);
            if (lab.Completed && RoundControl(new Rect(r.xMax - 158, r.yMax - 58, 133, 36), "Repetir", true))
                lab.Open(lab.Selected);
        }

        private void JuniorSolar(Rect view, Rect controls, LunarJunior lab)
        {
            Label(view.x + 16, view.y + 13, 340, $"GENERACIÓN    {lab.SolarPower:0} W", orange, heading);
            Label(view.x + 18, view.y + 43, 340, $"Consumo activo   {lab.Demand} W", cloud, body);
            Vector2 sun = new(view.x + 59, view.y + 107);
            Dot(sun, 54, Ink("785343"));
            Dot(sun, 36, Color.Lerp(Ink("806456"), orange, lab.Light / 100f));
            Vector2 array = new(view.x + 223, view.y + 132);
            float angle = (lab.PanelAngle - 45f) * Mathf.Deg2Rad;
            Vector2 along = new(Mathf.Cos(angle), Mathf.Sin(angle));
            Vector2 down = new(-along.y, along.x);
            for (int i = -2; i <= 2; i++)
            {
                Vector2 p = array + along * (i * 25);
                Stroke(p - down * 27f, p + down * 27f, 23f, lab.Panels ? Ink("718393") : Ink("555862"));
                Stroke(p - down * 22f, p + down * 22f, 2f, cloud);
            }
            for (int i = 0; i < Mathf.CeilToInt(lab.Dust / 3f); i++)
                Dot(array + along * (i * 37 % 111 - 55) + down * (i * 17 % 49 - 24), 4f, Ink("C58D61"));
            Label(view.x + 18, view.y + 199, 320, $"Batería   {lab.Battery:0} %   ·   Polvo   {lab.Dust:0} %", cloud, body);
            Meter(new Rect(view.x + 19, view.y + 231, 337, 8), lab.Battery / 100f, orange);
            Meter(new Rect(view.x + 19, view.y + 255, 337, 6), Mathf.Clamp01(lab.Stable / 4f), cloud);

            if (lab.Completed) return;
            LabToggle(controls, 13, "Paneles solares", ref lab.Panels);
            LabToggle(controls, 47, "Hábitat", ref lab.Habitat);
            LabToggle(controls, 81, "Antena", ref lab.SolarAntenna);
            LabStep(controls, 123, "Luz solar", "%", ref lab.Light, 10, 0, 100);
            LabStep(controls, 160, "Inclinación", "°", ref lab.PanelAngle, 5, 0, 90);
            if (RoundControl(new Rect(controls.x + 17, controls.y + 208, 141, 34), "Añadir polvo"))
                lab.Dust = Mathf.Min(100f, lab.Dust + 15f);
            if (RoundControl(new Rect(controls.x + 170, controls.y + 208, 186, 34),
                lab.Cleaner ? "Parar limpieza" : "Activar limpieza", !lab.Cleaner))
                lab.Cleaner = !lab.Cleaner;
            Label(controls.x + 17, controls.y + 250, 343, "Mantén el balance durante 4 segundos.", cloud, small);
        }

        private void JuniorRover(Rect view, Rect controls, LunarJunior lab)
        {
            Fill(new Rect(view.x + 8, view.y + 68, view.width - 16, 161), Ink("5F514E"));
            Vector2 dock = new(view.x + 47, view.y + 188);
            for (int i = 0; i < LunarJunior.Routes.Length; i++)
            {
                Vector2 destination = RoverDestination(view, i);
                bool selected = lab.Route == i;
                Stroke(dock, destination, selected ? 3f : 1f, selected ? orange : Ink("B59885"));
                Dot(destination, 43f, Ink("493C38"));
                Dot(destination, 26f, Ink("786359"));
                if (!selected || (!lab.Held && !lab.Stored))
                    Dot(destination + LabAngle(LunarJunior.Routes[i].Target) * 33f, 9f, cloud);
            }
            Vector2 target = RoverDestination(view, lab.Route);
            float along = lab.Phase == LunarJunior.RoverPhase.Outbound ? lab.Travel :
                lab.Phase == LunarJunior.RoverPhase.Sampling ? 1f :
                lab.Phase == LunarJunior.RoverPhase.Returning ? 1f - lab.Travel : 0f;
            Vector2 rover = Vector2.Lerp(dock, target, along);
            Fill(new Rect(dock.x - 18, dock.y + 9, 35, 14), Ink("C38C64"));
            Dot(rover + new Vector2(-10, 6), 11f, graphite);
            Dot(rover + new Vector2(10, 6), 11f, graphite);
            Fill(new Rect(rover.x - 18, rover.y - 9, 36, 16), cloud);
            if (lab.Phase == LunarJunior.RoverPhase.Sampling)
            {
                Vector2 tip = rover + LabAngle(lab.ArmAngle) * 33f;
                Stroke(rover, tip, 4f, orange);
                Dot(tip, lab.Held ? 10f : 6f, lab.Held ? cloud : orange);
            }
            Label(view.x + 17, view.y + 15, 339, $"ROVER   ·   BATERÍA {lab.RoverBattery:0} %", cloud, heading);
            Meter(new Rect(view.x + 18, view.y + 46, 339, 7), lab.RoverBattery / 100f, orange);
            string sample = lab.Stored ? LunarJunior.Routes[lab.Route].Sample : "Depósito vacío";
            Label(view.x + 17, view.y + 244, 345, sample, cloud, body);

            if (lab.Phase == LunarJunior.RoverPhase.Planning)
            {
                for (int i = 0; i < LunarJunior.Routes.Length; i++)
                {
                    var route = LunarJunior.Routes[i];
                    if (RoundControl(new Rect(controls.x + 16, controls.y + 15 + i * 46, 338, 34),
                        $"{route.Name}  ·  ida y vuelta {2 * route.Cost} %", lab.Route == i))
                        lab.ChooseRoute(i);
                }
                Label(controls.x + 22, controls.y + 163, 327, $"Reserva prevista   {Mathf.Max(0, lab.RoverReserve)} %", cloud, heading);
                if (RoundControl(new Rect(controls.x + 17, controls.y + 211, 337, 38), "Enviar el rover", true))
                    lab.Dispatch();
            }
            else if (lab.Phase == LunarJunior.RoverPhase.Sampling)
            {
                int goal = LunarJunior.Routes[lab.Route].Target;
                Label(controls.x + 17, controls.y + 19, 339, $"La roca está a {goal}°", cloud, heading);
                LabStep(controls, 61, "Brazo", "°", ref lab.ArmAngle, 5, 0, 90);
                if (!lab.Held && !lab.Stored && RoundControl(new Rect(controls.x + 17, controls.y + 114, 338, 36), "Cerrar pinza", true))
                    lab.Grab();
                if (lab.Held && RoundControl(new Rect(controls.x + 17, controls.y + 161, 338, 36), "Guardar muestra", true))
                    lab.Store();
                if (lab.Stored && RoundControl(new Rect(controls.x + 17, controls.y + 211, 338, 36), "Volver a la base", true))
                    lab.ReturnRover();
            }
        }

        private static Vector2 RoverDestination(Rect view, int route) =>
            new(view.x + 153 + route * 77, view.y + (route % 2 == 0 ? 115 : 164));

        private static Vector2 LabAngle(int angle)
        {
            float radians = angle * Mathf.Deg2Rad;
            return new Vector2(Mathf.Cos(radians), -Mathf.Sin(radians));
        }

        private void JuniorRadio(Rect view, Rect controls, LunarJunior lab)
        {
            Label(view.x + 16, view.y + 15, 336, $"ENLACE   {lab.Signal} %", orange, heading);
            Meter(new Rect(view.x + 17, view.y + 47, 339, 8), lab.Signal / 100f, orange);
            Vector2 basePoint = new(view.x + 68, view.y + 166);
            Vector2 earth = new(view.x + 288, view.y + 101);
            Dot(earth, 75f, Ink("536879"));
            if (earthView != null)
                GUI.DrawTexture(new Rect(earth.x - 40, earth.y - 40, 80, 80), earthView, ScaleMode.ScaleToFit);
            Vector2 beam = LabAngle(lab.AntennaAngle);
            Stroke(basePoint, basePoint + beam * 55f, 6, cloud);
            Stroke(basePoint + new Vector2(-15, 13), basePoint + new Vector2(15, 13), 5, cloud);
            if (lab.Linked)
                Stroke(basePoint + beam * 55f, earth, 1f, lab.Signal >= 75 ? orange : Ink("838A95"));
            if (lab.Sending > 0 && !lab.Completed)
                Dot(Vector2.Lerp(basePoint + beam * 55f, earth, lab.Sending), 11, orange);
            Text(new Rect(view.x + 17, view.y + 220, 339, 44),
                lab.LastSample == null ? "Observación de práctica: relieve del cráter." : $"Observación del rover: {lab.LastSample}.",
                cloud, paragraph);
            if (lab.Completed) return;
            LabToggle(controls, 15, "Alimentar antena", ref lab.Radio);
            LabToggle(controls, 54, "Conectar enlace", ref lab.Linked);
            LabStep(controls, 111, "Orientación", "°", ref lab.AntennaAngle, 5, 0, 90);
            Label(controls.x + 17, controls.y + 157, 339, "Objetivo 45° · señal mínima 75 %", cloud, body);
            if (RoundControl(new Rect(controls.x + 17, controls.y + 211, 338, 38),
                lab.Sending > 0 ? "Enviando…" : "Transmitir observación", true))
                lab.Transmit();
        }

        private void LabToggle(Rect area, float y, string name, ref bool value)
        {
            if (RoundControl(new Rect(area.x + 17, area.y + y, 338, 29), name + (value ? "   ✓" : "   ·   Apagado"), value))
                value = !value;
        }

        private void LabStep(Rect area, float y, string name, string unit, ref int value, int step, int min, int max)
        {
            float top = area.y + y;
            Label(area.x + 17, top + 4, 238, $"{name}    {value}{unit}", cloud, body);
            if (RoundControl(new Rect(area.xMax - 100, top, 37, 29), "−"))
                value = Math.Max(min, value - step);
            if (RoundControl(new Rect(area.xMax - 54, top, 37, 29), "+"))
                value = Math.Min(max, value + step);
        }
    }
}
