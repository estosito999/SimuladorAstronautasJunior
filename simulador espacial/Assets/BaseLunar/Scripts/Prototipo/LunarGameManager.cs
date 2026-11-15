using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.SceneManagement;
using static BaseLunar.LunarShapes;

namespace BaseLunar
{
    [DisallowMultipleComponent]
    public sealed class LunarGameManager : MonoBehaviour
    {
        private sealed class Job
        {
            public string Name, Place, Hint, Impact, JournalNote;
            public Vector2 Position;
            public Action Apply;
            public SpriteRenderer Marker;
            public bool Done, Repeatable;
            public int LastCompletedDay;
        }

        private sealed class DayCheckpoint
        {
            public int Day, Packets, Errors;
            public float Stress, Fatigue, CampaignTime;
            public bool Equipped;
            public float Tank;
            public Vector2 Position;
            public ResourceManager.Checkpoint Station;
            public (float Exposure, float Damage) Hazards;
            public (bool Done, int LastDay)[] Jobs;
            public bool[] Tapes;
        }

        private readonly List<Job> jobs = new();
        private int completed;
        private LunarMap map;
        private LunarShapes art;
        private ResourceManager resources;
        private AirlockController airlock;
        private EvaCrewState crew;
        private CrewMemberController movement;
        private Camera cameraView;
        private Vector3 cameraFollow;
        private readonly LunarHazards hazards = new();
        private readonly LunarExercise exerciseGame = new();
        private LunarCrewArt crewArt;
        private LunarDeathAnimation deathAnimation;
        private LunarArrival cinematic;
        private Rigidbody2D playerBody;
        private bool collectionsOpen;
        private readonly LunarJunior junior = new();
        private static bool playOnReload;
        private static DayCheckpoint pendingDayReload;
        private DayCheckpoint dayCheckpoint;
        private static readonly Vector2 TerminalPosition = new(-3.24f, 0.65f);
        private static readonly Color SurfaceSky = Ink("754438"), SpaceSky = Ink("0D1425");
        private const int DailyLimit = LunarWorkSchedule.DailySlots;
        private const int CampaignDays = LunarWorkSchedule.LastDay;
        private const int TransmissionTask = 3;
        private const float TransmissionDuration = 2.2f;
        private const float SleepDuration = 2.4f;
        private const float SleepDawn = 0.5f;
        private LunarTutorial tutorial;
        private LunarAirlockVapor chamberVapor;
        private Transform shiftTerminal;
        private bool instructorPanel, terminalPanel, telescopePanel, practice;
        private int day, doneToday;
        private readonly List<(string Name, string Impact)> journalJobs = new(DailyLimit);
        private readonly LunarVhs vhs = new();
        private bool journalOpen, televisionOpen;
        private bool solarJournalPage, marsTrekOpen;
        private readonly int[] marsOrder = new int[LunarNasaData.MarsSites.Length];
        private int marsRound, marsMiss;
        private float marsTrekCloseAt;
        private string journalEntry;
        private string lastJobNote;
        private float fatigue, journalOxygen, journalRadiation, journalStress;
        private float sleepProgress = -1f;
        private float transmissionEndsAt;
        private int packetsSent;
        private bool sentToday;
        private float stress;
        private bool MandatoryTransmission => LunarWorkSchedule.ReportDue(day, sentToday);
        private bool Sleeping => sleepProgress >= 0f;
        private bool Transmitting => transmissionEndsAt > 0f;
        private Job nearby, active;
        private int calibrationErrors;
        private float poweredAt;
        private string notice;
        private float noticeUntil;
        private bool showMap, victory;
        private LunarHud hud;
        private Transform world;
        private bool started;
        private bool campaignExpired;
        private bool dismissed, dismissalPrompt;
        private bool retryPrompt;
        private string dismissalReason;
        private float nextLeakNotice;
        private float endedAt;

        private int Completed => completed;
        private bool Finished => victory || campaignExpired || dismissed || crew.IsDead;
        private bool AnimatingDeath => deathAnimation != null && deathAnimation.Playing;
        private string RoomName
        {
            get
            {
                if (crew.CurrentZone == CrewZone.Exterior) return "Superficie lunar";
                if (crew.CurrentZone == CrewZone.Airlock) return "Cámara EVA";
                for (int i = 0; i < map.Centers.Length; i++)
                    if (Vector2.Distance(crew.Position, map.Centers[i]) <
                        (i == 0 ? LunarMap.CoreApothem : LunarMap.RoomApothem)) return LunarMap.RoomNames[i];
                return "Pasillo radial";
            }
        }

        private void Awake()
        {
            Application.targetFrameRate = 60;
            world = Group(transform, "Estación Selene", Vector2.zero);
            world.gameObject.SetActive(false);
            art = new LunarShapes();
            map = new LunarMap(world, art);
            chamberVapor = new LunarAirlockVapor(world, art, map.ChamberZone);
            tutorial = new LunarTutorial(world, art, map, LunarArrival.MaraRoom);
            BuildTerminal();
            BuildSystems();
            cinematic = new LunarArrival(world, art, airlock, playerBody, crewArt, tutorial);
            BuildJobs();
            BuildCamera();
            hud = new LunarHud();
            world.gameObject.SetActive(true);
            resources.enabled = false;
            resources.SetAntennaCalibration(0.45f);
            airlock.Changed += RefreshDoors;
            airlock.CommandRejected += Message;
            crew.Changed += RefreshCrew;
            RefreshDoors(airlock);
            crewArt.Refresh(crew);
            map.ShowStoredSuit(!crew.HasSpaceSuit);
            InputSystem.onEvent += LunarControls.TrackActivity;
        }

        private void Start()
        {
            if (pendingDayReload != null)
            {
                DayCheckpoint snapshot = pendingDayReload;
                pendingDayReload = null;
                RestoreDay(snapshot);
                return;
            }
            if (!playOnReload)
                return;
            playOnReload = false;
            StartMission();
        }

        private void BuildTerminal()
        {
            shiftTerminal = Group(world, "Terminal de jornada", TerminalPosition);
            art.Plate(shiftTerminal, "Carcasa", Vector2.zero, new Vector2(1.06f, 0.68f), Ink("516A80"), 4);
            art.Plate(shiftTerminal, "Pantalla", new Vector2(0, 0.045f),
                new Vector2(0.88f, 0.38f), Ink("182A3A"), 5);
            art.Plate(shiftTerminal, "Luz activa", new Vector2(0, 0.045f),
                new Vector2(0.56f, 0.08f), Ink("7AE1CE"), 6);
            art.Disc(shiftTerminal, "Baliza de turno", new Vector2(0, 0.56f), Vector2.one * 0.23f, Ink("B86C42"), 5);
            shiftTerminal.gameObject.SetActive(false);
        }

        private void BuildSystems()
        {
            resources = Group(world, "Recursos", Vector2.zero).gameObject.AddComponent<ResourceManager>();
            resources.Configure(ScriptableObject.CreateInstance<StationResourceProfile>());
            StationModule garage = null;
            for (int i = 0; i < map.Rooms.Length; i++)
            {
                int id = LunarMap.ModuleIds[i];
                var profile = ScriptableObject.CreateInstance<StationModuleProfile>();
                var flow = id switch
                {
                    2 => new ResourceFlow(0f, -0.06f, 0.15f),
                    3 => new ResourceFlow(0.28f, 0.18f, 0f),
                    _ => default
                };
                profile.Configure(id, id == 3 ? 1.3f : 0.62f, flow);
                var module = map.Rooms[i].gameObject.AddComponent<StationModule>();
                module.Configure(profile, resources);
                if (id == 7) garage = module;
            }

            GameObject astronaut = Group(world, "Tripulante", Vector2.zero).gameObject;
            astronaut.layer = 2; // Ignore Raycast. Sigue participando en colisiones físicas.
            var body = astronaut.AddComponent<Rigidbody2D>();
            playerBody = body;
            body.gravityScale = 0f;
            body.freezeRotation = true;
            body.interpolation = RigidbodyInterpolation2D.Interpolate;
            body.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            astronaut.AddComponent<CircleCollider2D>().radius = 0.28f;
            crewArt = new LunarCrewArt(astronaut.transform, art);
            deathAnimation = new LunarDeathAnimation(astronaut.transform, crewArt, art);

            crew = astronaut.AddComponent<EvaCrewState>();
            movement = astronaut.AddComponent<CrewMemberController>();
            crew.ConfigureMovement(movement, 105f);
            movement.Bind(crew, crewArt);
            movement.ControlsLocked = true;

            airlock = Group(world, "Protocolo EVA", Vector2.zero).gameObject.AddComponent<AirlockController>();
            airlock.Configure(garage, crew, map, allowUnsuitedExit: true);
        }

        private void BuildCamera()
        {
            cameraView = Camera.main;
            if (cameraView == null)
            {
                var cameraObject = new GameObject("Cámara de seguimiento") { tag = "MainCamera" };
                cameraObject.transform.SetParent(transform, false);
                cameraView = cameraObject.AddComponent<Camera>();
            }

            cameraView.orthographic = true;
            cameraView.orthographicSize = 6.3f;
            cameraView.clearFlags = CameraClearFlags.SolidColor;
            cameraView.backgroundColor = SurfaceSky;
            cameraView.transform.position = new Vector3(0f, 0f, -10f);
            cameraFollow = cameraView.transform.position;
        }

        private void BuildJobs()
        {
            AddJob("Reinicia el tablero", 0, new Vector2(1.30f, 0.55f),
                "Arrastra el puente al contacto indicado.", "+8 puntos de casco",
                "Al reiniciar el tablero dejaron de parpadear los avisos del casco.", () => resources.AdjustHull(8));
            AddJob("Riega los cultivos", 2, new Vector2(-0.48f, -0.19f),
                "Abre dos válvulas para obtener un caudal de 7.", "+18 comida · −4 agua",
                "Regué los cultivos. El invernadero es el único sitio que huele un poco a casa.",
                () => resources.AdjustReserves(new ResourceFlow(0, -4, 18)), repeatable: true);
            AddJob("Purga el filtro de O₂", 3, new Vector2(0.0f, -0.30f),
                "Mantén pulsado el purgador hasta vaciar la cámara.", "+24 O₂ · +5 agua",
                "Al purgar el filtro oí cambiar el zumbido del soporte vital.",
                () => resources.AdjustReserves(new ResourceFlow(24, 5, 0)), repeatable: true);
            AddJob("Envío de datos a la Tierra", LunarMap.CommunicationsRoom, LunarMap.ResearchUplink,
                "Repite los pulsos de la consola para enviar los datos de investigación.", "+1 paquete de datos enviado",
                "La Tierra confirmó el informe. Por un momento supe que alguien me escuchaba.", SendResearch);
            AddJob("Limpia los paneles", -1, LunarMap.SolarJob,
                "Arrastra el cepillo por toda la superficie hasta quitar el polvo.", "Se recupera la potencia solar",
                "Dejé limpios los paneles. Todavía veo polvo en las costuras de los guantes.",
                resources.CleanSolarPanels, repeatable: true);
            AddJob("Limpia y calibra la antena", -1, LunarMap.AntennaJob,
                "Sintoniza el dial dentro de la banda verde.", "Antena limpia y calibrada al 100 %",
                "Ajusté la antena hasta que la señal dejó de saltar. Fue un alivio.", () =>
                {
                    resources.CleanAntenna();
                    resources.SetAntennaCalibration(1f);
                });
            AddJob("Instala el escudo", -1, LunarMap.ShieldJob,
                "Gira los tres anclajes hasta que apunten arriba.", "−85 % de radiación recibida",
                "Apreté el último anclaje del escudo con las dos manos. Ya está firme.", () => resources.SetRadiationShieldCoverage(0.85f));
            AddJob("Entrenamiento diario", 4, new Vector2(0, 0.65f),
                "Pulsa Espacio repetidamente para terminar la rutina.", "+12 salud · +8 moral · menos estrés",
                "Conté las repeticiones en voz alta. El eco me hizo compañía en el gimnasio.", () =>
                {
                    resources.AdjustCrew(8, 12);
                    stress = Mathf.Max(0, stress - 0.38f);
                }, repeatable: true);
            resources.AdjustHull(-12f);
        }

        private void AddJob(string name, int room, Vector2 point, string hint, string impact, string journalNote, Action apply,
            bool repeatable = false)
        {
            Vector2 center = room < 0 ? point : map.Centers[room] + point;
            Color color = Ink(room < 0 ? "F9BB77" : LunarMap.RoomColors[room]);
            art.Disc(world, "Base de tarea", center, new Vector2(0.96f, 0.62f), Ink("202B3B"), 4);
            art.Plate(world, "Baliza de tarea", center, new Vector2(0.40f, 0.4f), color, 5, 45f);
            SpriteRenderer marker = art.Disc(world, "Estado de tarea", center, Vector2.one * 0.18f, Ink("F3F7FE"), 6);
            jobs.Add(new Job
            {
                Name = name, Place = room < 0 ? "Superficie lunar" : LunarMap.RoomNames[room],
                Position = center, Hint = hint, Impact = impact, JournalNote = journalNote,
                Apply = apply, Marker = marker, Repeatable = repeatable
            });
        }

        private void Update()
        {
            // La escena genera sus tareas en Awake. Una recarga de scripts en
            // Play Mode requiere iniciar el turno de nuevo desde el editor.
            if (hud == null)
                return;

            Keyboard keys = Keyboard.current;
            bool keyboardConfirm = keys != null &&
                (keys.enterKey.wasPressedThisFrame || keys.numpadEnterKey.wasPressedThisFrame);
            Gamepad pad = LunarControls.PS4;
            bool confirm = keyboardConfirm || (pad?.buttonSouth.wasPressedThisFrame ?? false);
            bool interact = (keys?.eKey.wasPressedThisFrame ?? false) || (pad?.buttonWest.wasPressedThisFrame ?? false);
            bool options = pad?.startButton.wasPressedThisFrame ?? false;
            bool skip = (keys?.nKey.wasPressedThisFrame ?? false) || options;
            bool cancel = (keys?.escapeKey.wasPressedThisFrame ?? false) || (pad?.buttonEast.wasPressedThisFrame ?? false);
            bool mapInput = (keys?.mKey.wasPressedThisFrame ?? false) || (keys?.tabKey.wasPressedThisFrame ?? false) ||
                (pad?.buttonNorth.wasPressedThisFrame ?? false);
            if (cinematic.Playing)
            {
                if ((skip && !cinematic.Abandoning) || cinematic.Tick(Time.unscaledDeltaTime))
                    FinishCinematic();
                return;
            }
            if (Sleeping)
            {
                if (journalOpen)
                {
                    if (confirm)
                        TurnJournalPage();
                    return;
                }
                sleepProgress += Time.unscaledDeltaTime / SleepDuration;
                if (journalEntry != null && sleepProgress >= SleepDawn)
                {
                    sleepProgress = SleepDawn;
                    journalOpen = true;
                }
                else if (sleepProgress >= 1f)
                {
                    sleepProgress = -1f;
                    resources.enabled = !Finished;
                    if (victory)
                    {
                        airlock.enabled = false;
                        LockCinematic();
                        cinematic.BeginVictory();
                        cameraFollow = new Vector3(cinematic.Focus.x, cinematic.Focus.y, -10f);
                    }
                }
                return;
            }
            if (keys != null && keys.rKey.wasPressedThisFrame && Finished && !AnimatingDeath)
            {
                if (!victory && dayCheckpoint != null)
                    RetryDay();
                else
                    Restart();
                return;
            }

            if (!started)
            {
                if (junior.Selected >= 0)
                {
                    if (cancel)
                        junior.Close();
                    else if (junior.Tick(Time.unscaledDeltaTime))
                        LunarCollection.Unlock($"Junior.{junior.Selected}");
                }
                else if (collectionsOpen && cancel)
                    collectionsOpen = false;
                else if (!collectionsOpen && keyboardConfirm)
                    StartMission();
                return;
            }

            if (day == 0 && skip)
            {
                SkipTutorial();
                return;
            }

            if (Finished)
            {
                movement.ControlsLocked = true;
                return;
            }

            if (retryPrompt)
            {
                if (cancel)
                    retryPrompt = false;
                return;
            }
            if (options && day > 0 && !Transmitting)
            {
                AskRetry();
                return;
            }

            if (day > 0 && Time.time >= nextLeakNotice && !jobs[2].Done)
            {
                nextLeakNotice = Time.time + 32f;
                Message("La reserva de O₂ cae. Purga el filtro en soporte vital.");
            }

            if (!Transmitting && cancel)
            {
                active = null;
                showMap = false;
                terminalPanel = false;
                telescopePanel = false;
                televisionOpen = false;
                marsTrekOpen = false;
                dismissalPrompt = false;
                vhs.Stop();
                practice = false;
                hud.CancelDrag();
            }

            if (!terminalPanel && !telescopePanel && !televisionOpen && !marsTrekOpen &&
                !dismissalPrompt && !practice && active == null &&
                mapInput)
                showMap = !showMap;

            movement.ControlsLocked = showMap || active != null || terminalPanel || telescopePanel ||
                televisionOpen || marsTrekOpen || dismissalPrompt || practice;
            if (day == 0 && !showMap && !instructorPanel && !telescopePanel && !practice)
                tutorial.Tick(crew.Position, Time.deltaTime);
            if (day > 0 && CheckSurvivalFailure())
                return;

            if (Transmitting)
            {
                if (Time.unscaledTime >= transmissionEndsAt)
                {
                    transmissionEndsAt = 0f;
                    if (practice)
                        FinishPractice(true);
                    else
                        CompleteTask();
                }
                return;
            }

            if (instructorPanel && !showMap)
            {
                if (confirm || (pad?.buttonWest.wasPressedThisFrame ?? false))
                    AdvanceDialogue();
                return;
            }

            if (telescopePanel)
            {
                if (interact)
                    CloseTelescope();
                return;
            }

            if (televisionOpen)
            {
                int tape = vhs.Current;
                if (vhs.Update(Time.unscaledTime))
                {
                    LunarCollection.Unlock($"VHS.{tape}");
                    stress *= 0.5f;
                    Message("Cinta terminada · Estrés reducido a la mitad.");
                }
                return;
            }

            if (marsTrekOpen)
            {
                if (marsTrekCloseAt > 0f && Time.unscaledTime >= marsTrekCloseAt)
                    marsTrekOpen = false;
                return;
            }

            if (showMap || terminalPanel || dismissalPrompt)
                return;

            bool jump = (keys?.spaceKey.wasPressedThisFrame ?? false) || (pad?.buttonSouth.wasPressedThisFrame ?? false);
            if (practice)
            {
                if (tutorial.PracticeTask == LunarExercise.Task && exerciseGame.Update(Time.unscaledTime, jump))
                    FinishPractice(true);
                return;
            }

            if (active != null)
            {
                if (active == jobs[LunarExercise.Task] && exerciseGame.Update(Time.unscaledTime, jump))
                {
                    CompleteTask();
                    return;
                }
                if (keys != null && active == jobs[0])
                {
                    if (keys.digit1Key.wasPressedThisFrame) hud.Connect(1, CompleteTask, TaskError);
                    else if (keys.digit2Key.wasPressedThisFrame) hud.Connect(2, CompleteTask, TaskError);
                    else if (keys.digit3Key.wasPressedThisFrame) hud.Connect(3, CompleteTask, TaskError);
                }

                return;
            }

            nearby = day > 0 ? FindNearby() : null;
            if (interact) Interact();
        }

        private bool CheckSurvivalFailure()
        {
            StationResources state = resources.Current;
            if (state.HullPercent <= 0f)
                crew.Kill(CrewDeathCause.HullFailure, "El casco llegó al 0 %.", "Repara el tablero principal.");
            else if (state.BatteryKwh <= 0.0001f && state.SuppliedKw <= 0.01f && state.SolarEfficiency <= 0.15f)
                crew.Kill(CrewDeathCause.Blackout, "Los paneles cubiertos de polvo dejaron de alimentar Selene y se agotó la batería.",
                    "Limpia los paneles exteriores antes de consumir toda la reserva de energía.");
            else if (!hazards.UsingTank && state.Reserves.Oxygen <= 0f)
                crew.Kill(CrewDeathCause.Oxygen, "La base se quedó sin oxígeno.", "Purga el filtro y vigila la barra de oxígeno.");
            else if (state.Reserves.Water <= 0f)
                crew.Kill(CrewDeathCause.Dehydration, "Deshidratado. Se agotó el agua de la estación.",
                    "Purga el filtro para recuperar agua antes de regar o cerrar la jornada.");
            else if (state.Reserves.Food <= 0f)
                crew.Kill(CrewDeathCause.Hunger, "Se agotó la comida de la estación.", "Riega los cultivos para recuperar comida.");
            else if (hazards.Exposure >= 1f)
                crew.Kill(CrewDeathCause.Radiation, "Llegaste al máximo de exposición a la radiación.",
                    "Sigue las luces verdes y vuelve a la base para reducir la exposición.");
            else if (stress >= 1f)
                crew.Kill(CrewDeathCause.Stress, "El estrés llegó al máximo.", "Entrena o descansa en tu cama para reducir el estrés.");
            else if (state.HealthPercent <= 0f)
                crew.Kill(CrewDeathCause.HealthFailure, "La salud llegó al 0 %.", "Mantén las reservas y completa el entrenamiento.");
            return crew.IsDead;
        }

        private void LateUpdate()
        {
            if (hud == null || cameraView == null)
                return;

            if (AnimatingDeath)
                deathAnimation.Tick(Time.unscaledDeltaTime);
            float aspect = Mathf.Max(0.4f, cameraView.aspect);
            float overview = Mathf.Max(32f, 68f / aspect);
            Vector2 target = cinematic.Playing ? cinematic.Focus :
                showMap ? new Vector2(20f + overview * aspect * 0.19f, 2f) :
                Sleeping ? Vector2.Lerp(crew.Position, LunarMap.Bedroom, Mathf.Sin(Mathf.PI * sleepProgress)) : crew.Position;
            float amount = 1f - Mathf.Exp(-Time.unscaledDeltaTime * 7f);
            float closeView = Mathf.Max(6.3f, 6.6f / aspect);
            float zoom = cinematic.Playing ? Mathf.Max(cinematic.Zoom, closeView) : showMap ? overview : closeView;
            if (cinematic.Playing && cinematic.Winning)
                zoom = Mathf.Max(cinematic.Zoom, (cinematic.VictoryCloseup ? 2.1f : 5.1f) / aspect);
            cameraView.backgroundColor = cinematic.Playing && cinematic.VictorySpace ? SpaceSky : SurfaceSky;
            if (AnimatingDeath && deathAnimation.Cause != CrewDeathCause.Ejection &&
                deathAnimation.Cause != CrewDeathCause.Dismissed && deathAnimation.Cause != CrewDeathCause.Blackout)
                zoom = Mathf.Max(3.3f, 3.7f / aspect);
            cameraView.orthographicSize = Mathf.Lerp(cameraView.orthographicSize, zoom, amount);
            cameraFollow = Vector3.Lerp(cameraFollow,
                new Vector3(target.x, target.y, -10f), amount);
            bool survival = day > 0 && !Finished && !Sleeping;
            bool onProtectedRoute = crew.CurrentZone == CrewZone.Exterior && map.IsOnProtectedPath(crew.Position);
            hazards.Update(crew, airlock, resources, survival ? Time.deltaTime : 0f, onProtectedRoute);
            if (survival)
            {
                float workload = 0.0015f * doneToday + (active != null ? 0.0018f : 0f);
                stress = Mathf.Clamp01(stress + Time.deltaTime *
                    (0.0017f + workload + hazards.OxygenDanger * 0.008f + hazards.RadiationDanger * 0.006f));
            }
            movement.OxygenSpeedMultiplier = survival ? Mathf.Lerp(1f, 0.48f, hazards.OxygenDanger) : 1f;
            cameraView.transform.position = cameraFollow +
                (survival && !showMap && !Sleeping ? (Vector3)hazards.CameraShake(Time.unscaledTime) : Vector3.zero);
            map.AnimateGates(airlock.DoorsOpen, airlock.InnerFieldActive, airlock.OuterFieldActive, Time.deltaTime);
            chamberVapor.Tick(airlock.Pressure, Time.deltaTime);
        }

        private bool AvailableJob(Job job)
        {
            if (job == jobs[TransmissionTask]) return MandatoryTransmission;
            return job.Repeatable ? job.LastCompletedDay != day : !job.Done;
        }

        private string JobStatus(Job job)
        {
            if (job == jobs[TransmissionTask])
                return MandatoryTransmission ? "Obligatorio hoy" : sentToday ? "Enviado hoy" : "Días 5, 10 y 15";
            if (day > 0 && AvailableJob(job) && !HasSlot(job))
                return doneToday >= DailyLimit ? "Sin cupo hoy" : "Cupo para el informe";
            if (job.Repeatable && day > 0)
                return AvailableJob(job) ? "Disponible hoy" : "Hecho hoy";
            return job.Done ? "Completado" : "Pendiente";
        }

        private bool HasSlot(Job job) => LunarWorkSchedule.CanStart(doneToday,
            MandatoryTransmission, job == jobs[TransmissionTask]);

        private Job FindNearby() => jobs.Find(job => AvailableJob(job) &&
            (job.Place == "Superficie lunar" ? crew.CurrentZone == CrewZone.Exterior : crew.CurrentZone == CrewZone.Interior) &&
            (job.Position - crew.Position).sqrMagnitude < 1.45f * 1.45f);

        private bool AtLocker() => map.SuitZone.OverlapPoint(crew.Position) && crew.CurrentZone == CrewZone.Interior;
        private bool NearInstructor() => day == 0 && crew.CurrentZone == CrewZone.Interior &&
            tutorial.CanTalk(crew.Position);
        private bool NearTerminal() => day > 0 && crew.CurrentZone == CrewZone.Interior &&
            (crew.Position - TerminalPosition).sqrMagnitude <= 1.9f * 1.9f;
        private bool NearBed() => day > 0 && crew.CurrentZone == CrewZone.Interior &&
            (crew.Position - LunarMap.Bedroom).sqrMagnitude <= 1.3f * 1.3f;
        private bool NearTelescope() => crew.CurrentZone == CrewZone.Interior &&
            (crew.Position - LunarMap.TelescopePosition).sqrMagnitude <= 1.45f * 1.45f;
        private bool NearTelevision() => day > 0 && crew.CurrentZone == CrewZone.Interior &&
            (crew.Position - LunarMap.BedroomTelevision).sqrMagnitude <= 1.25f * 1.25f;
        private bool NearMarsTrek() => day > 0 && crew.CurrentZone == CrewZone.Interior &&
            (crew.Position - map.Centers[LunarMap.ResearchRoom] - LunarMap.MarsTrekConsole).sqrMagnitude <= 1.4f * 1.4f;
        private bool NearShip() => day > 0 && crew.HasSpaceSuit && crew.CurrentZone == CrewZone.Exterior &&
            (crew.Position - LunarArrival.BoardingPoint).sqrMagnitude <= 1.7f * 1.7f;
        private bool NearUplink() => crew.CurrentZone == CrewZone.Interior &&
            (crew.Position - jobs[TransmissionTask].Position).sqrMagnitude < 1.45f * 1.45f;

        private string InteractHint()
        {
            if (NearInstructor()) return "Hablar con Mara";
            if (NearBed())
                return LunarWorkSchedule.CanSleep(doneToday, MandatoryTransmission) ? "Dormir" : "Cama";
            if (NearTerminal()) return "Terminal de jornada";
            if (NearTelescope()) return "Telescopio";
            if (NearTelevision()) return "Televisor VHS";
            if (NearMarsTrek()) return "Cartografía Mars Trek";
            if (NearShip()) return "Embarcar y despegar";
            if (day == 0) return null;
            if (NearUplink()) return jobs[TransmissionTask].Name;
            if (nearby != null && HasSlot(nearby)) return nearby.Name;
            if (AtLocker()) return crew.HasSpaceSuit ? "Quitar el traje" : "Equipar traje EVA";
            return airlock.NearButton ? "Botón de la esclusa" : null;
        }

        private void Interact()
        {
            if (instructorPanel || terminalPanel || telescopePanel || televisionOpen || marsTrekOpen || dismissalPrompt ||
                practice || showMap || active != null || Finished)
                return;

            if (NearInstructor())
            {
                instructorPanel = true;
                return;
            }

            if (NearBed())
            {
                Sleep();
                return;
            }

            if (NearTerminal())
            {
                terminalPanel = true;
                movement.ControlsLocked = true;
                return;
            }

            if (NearTelescope())
            {
                telescopePanel = true;
                LunarCollection.Unlock("Earth");
                movement.ControlsLocked = true;
                return;
            }

            if (NearTelevision())
            {
                televisionOpen = true;
                movement.ControlsLocked = true;
                return;
            }

            if (NearMarsTrek())
            {
                for (int i = 0; i < marsOrder.Length; i++)
                    marsOrder[i] = i;
                for (int i = marsOrder.Length - 1; i > 0; i--)
                {
                    int other = UnityEngine.Random.Range(0, i + 1);
                    (marsOrder[i], marsOrder[other]) = (marsOrder[other], marsOrder[i]);
                }
                marsRound = 0;
                marsMiss = -1;
                marsTrekCloseAt = 0f;
                marsTrekOpen = true;
                movement.ControlsLocked = true;
                return;
            }

            if (day == 0)
                return;

            if (NearShip())
            {
                resources.enabled = false;
                airlock.enabled = false;
                LockCinematic();
                cinematic.BeginAbandonment();
                return;
            }

            if (nearby != null && HasSlot(nearby))
            {
                active = nearby;
                hud.ResetTask();
                if (active == jobs[LunarExercise.Task])
                    exerciseGame.Reset(day);
                movement.ControlsLocked = true;
                return;
            }

            if (AtLocker())
            {
                if (crew.HasSpaceSuit) airlock.RemoveSuit();
                else
                {
                    airlock.EquipSuit();
                    if (crew.HasSpaceSuit) Message("Traje equipado. Entra en la cámara.");
                }
                return;
            }

            if (NearUplink())
            {
                Message(sentToday ? "La Tierra ya recibió los datos de hoy." :
                    "Informes programados para los días 5, 10 y 15.");
                return;
            }

            if (airlock.NearButton)
                airlock.PressButton();
            else if (nearby != null)
                Message(MandatoryTransmission ? "El último cupo está reservado para enviar datos." :
                    "Cupo diario completo. Vuelve a tu cama para dormir.");
        }

        private void CloseTelescope()
        {
            telescopePanel = false;
            movement.ControlsLocked = false;
        }

        private void RefreshDoors(AirlockController state)
        {
            if (lastPressure != state.Pressure && (state.Pressure == AirlockPressure.Depressurizing ||
                state.Pressure == AirlockPressure.Repressurizing))
                Message(state.Pressure == AirlockPressure.Depressurizing ?
                    "Compuertas cerradas · despresurizando." : "Compuertas cerradas · represurizando.");
            if (lastPressure == AirlockPressure.Depressurizing && state.Pressure == AirlockPressure.Vacuum)
                Message("Esclusa en vacío · paso abierto hacia la Luna.");
            if (lastPressure == AirlockPressure.Repressurizing && state.Pressure == AirlockPressure.Pressurized)
                Message("Presión restaurada · paso abierto hacia el garaje.");
            lastPressure = state.Pressure;
        }

        private AirlockPressure lastPressure = AirlockPressure.Pressurized;

        private void StartMission()
        {
            started = true;
            LockCinematic();
            cinematic.BeginArrival();
            cameraFollow = new Vector3(cinematic.Focus.x, cinematic.Focus.y, -10f);
        }

        private void LockCinematic()
        {
            movement.ControlsLocked = true;
            movement.enabled = false;
            playerBody.linearVelocity = Vector2.zero;
            playerBody.simulated = false;
        }

        private void FinishCinematic()
        {
            if (cinematic.Winning)
            {
                cinematic.FinishVictory();
                LunarCollection.Unlock("End.Victory");
                return;
            }
            if (cinematic.Abandoning)
            {
                cinematic.FinishAbandonment();
                LunarCollection.Unlock("End.Abandoned");
                Dismiss("Abandonaste Selene antes de cumplir tu turno.");
                return;
            }
            bool departure = cinematic.Departure;
            if (departure)
                cinematic.FinishDeparture();
            else
            {
                cinematic.FinishArrival();
                LunarCollection.Unlock("Landing");
            }

            airlock.RestoreGameplay();
            playerBody.simulated = true;
            movement.enabled = true;
            Vector2 position = crew.Position;
            cameraFollow = new Vector3(position.x, position.y, -10f);
            if (departure)
                BeginDailyMode();
            else
                StartTutorial();
        }

        private void StartTutorial()
        {
            poweredAt = Time.time;
            movement.ControlsLocked = false;
            instructorPanel = true;
        }

        private void BeginDailyMode()
        {
            if (day > 0)
                return;

            day = 1;
            instructorPanel = false;
            shiftTerminal.gameObject.SetActive(true);
            resources.enabled = true;
            resources.SetOxygenLeak(0.28f);
            movement.ControlsLocked = false;
            poweredAt = Time.time;
            nextLeakNotice = Time.time + 20f;
            SaveDay();
            Message("Supervivencia · Día 1. Consulta el plano con M y elige tus trabajos.");
        }

        private void SkipTutorial()
        {
            transmissionEndsAt = 0f;
            if (day > 0)
                return;

            started = true;
            practice = false;
            showMap = false;
            telescopePanel = false;
            cinematic.FinishDeparture();
            hud.CancelDrag();
            BeginDailyMode();
        }

        private void Sleep()
        {
            if (MandatoryTransmission && doneToday >= LunarWorkSchedule.SleepMinimum)
            {
                dismissalPrompt = true;
                movement.ControlsLocked = true;
                return;
            }
            if (!LunarWorkSchedule.CanSleep(doneToday, MandatoryTransmission))
            {
                Message(MandatoryTransmission ? "Envía el informe en Comunicaciones antes de dormir." :
                    $"Completa al menos {LunarWorkSchedule.SleepMinimum} trabajos para dormir. Llevas {doneToday}.");
                return;
            }

            sleepProgress = 0f;
            solarJournalPage = false;
            resources.enabled = false;
            movement.ControlsLocked = true;
            journalOxygen = resources.OxygenFraction;
            journalRadiation = hazards.Exposure;
            journalStress = stress;
            float oxygenStrain = Mathf.InverseLerp(0.47f, 0.08f, journalOxygen);
            float radiationStrain = Mathf.InverseLerp(0.33f, 0.85f, journalRadiation);
            float stressStrain = Mathf.InverseLerp(0.45f, 0.95f, journalStress);
            float dailyWear = 0.09f * oxygenStrain + 0.10f * radiationStrain + 0.09f * stressStrain;
            fatigue = Mathf.Clamp01(Mathf.Max(0.025f * day, fatigue - 0.05f) + dailyWear);
            crewArt.SetFatigue(fatigue);
            journalEntry = WriteJournalEntry(oxygenStrain, radiationStrain, stressStrain);
        }

        private string WriteJournalEntry(float oxygenStrain, float radiationStrain, float stressStrain)
        {
            string work = sentToday ? jobs[TransmissionTask].JournalNote : lastJobNote;

            string condition = "";
            if (oxygenStrain > 0.25f)
                condition += " Tenía que parar para tomar aire.";
            if (radiationStrain > 0.25f)
                condition += " El dosímetro sigue demasiado alto.";
            if (stressStrain > 0.25f)
                condition += " Me cuesta dejar de pensar en las alarmas.";
            string mood = fatigue >= 0.72f ? "Me tiemblan las manos al escribir. Apenas me reconozco en el espejo." :
                fatigue >= 0.4f ? "Se me acumulan las ojeras. Hoy me costó llegar a la cama." :
                fatigue >= 0.17f ? "Ya siento el peso de los turnos. Espero dormir de un tirón." :
                "Todavía tengo ánimo. Voy a guardar el lápiz y apagar la luz.";
            return work + condition + "\n\n" + mood;
        }

        private void TurnJournalPage()
        {
            if (!journalOpen)
                return;
            if (!solarJournalPage)
            {
                solarJournalPage = true;
                LunarCollection.Unlock($"DONKI.{LunarNasaData.FlareIndex(day)}");
                return;
            }
            journalOpen = false;
            journalEntry = null;
            AdvanceDay();
        }

        private void SelectMarsSite(int index)
        {
            if (!marsTrekOpen || marsRound >= marsOrder.Length || Array.IndexOf(marsOrder, index) < marsRound)
                return;
            marsMiss = index == marsOrder[marsRound] ? -1 : index;
            if (marsMiss >= 0)
                return;
            LunarCollection.Unlock($"Mars.{index}");
            if (++marsRound == marsOrder.Length)
                marsTrekCloseAt = Time.unscaledTime + 3.4f;
        }

        private void AdvanceDay()
        {
            if (day == CampaignDays)
            {
                victory = Completed == jobs.Count;
                campaignExpired = !victory;
                if (campaignExpired)
                    LunarCollection.Unlock("End.Expired");
                endedAt = Time.time;
                resources.enabled = false;
                return;
            }

            day++;
            doneToday = 0;
            journalJobs.Clear();
            lastJobNote = null;
            sentToday = false;
            foreach (Job job in jobs)
                if (job.Repeatable)
                    job.Marker.color = Ink("F3F7FE");
            nearby = null;
            if (MandatoryTransmission)
                jobs[TransmissionTask].Marker.color = Ink("FFD393");
            resources.AdjustReserves(new ResourceFlow(-5f, -3f, -4f));
            resources.AdjustCrew(3f, 2f);
            stress = Mathf.Max(0, stress - 0.04f);
            SaveDay();
            Message(MandatoryTransmission ? $"Día {day} · Envía los datos antes de dormir." :
                $"Día {day} · Tres cupos disponibles. Descanso: −5 O₂, −3 agua, −4 comida.");
        }

        private void StartPractice()
        {
            practice = true;
            movement.ControlsLocked = true;
            instructorPanel = false;
            hud.ResetTask();
            if (tutorial.PracticeTask == LunarExercise.Task)
                exerciseGame.Reset(1);
        }

        private void FinishPractice(bool solved)
        {
            practice = false;
            hud.CancelDrag();
            if (solved)
                ContinueTour();
            else
                instructorPanel = true;
        }

        private void ContinueTour()
        {
            instructorPanel = false;
            if (tutorial.IsLast)
            {
                LockCinematic();
                cinematic.BeginDeparture();
                cameraFollow = new Vector3(cinematic.Focus.x, cinematic.Focus.y, -10f);
                return;
            }
            tutorial.Advance();
            movement.ControlsLocked = false;
            Message("Sigue a Mara. Pulsa E cuando se detenga.");
        }

        private void AdvanceDialogue()
        {
            if (tutorial.PracticeTask >= 0)
                StartPractice();
            else
                ContinueTour();
        }

        private void RefreshCrew(EvaCrewState state)
        {
            crewArt.Refresh(state);
            map.ShowStoredSuit(!state.HasSpaceSuit);
            if (!state.IsDead)
                return;
            LunarCollection.Unlock($"Death.{state.DeathCause}");
            if (state.DeathCause == CrewDeathCause.Hunger)
                crewArt.ShowSuit(false);
            deathAnimation.Play(state.DeathCause, state.HasSpaceSuit);
            showMap = false;
            endedAt = Time.time;
            resources.enabled = false;
        }

        private void Dismiss(string reason)
        {
            dismissalPrompt = false;
            dismissalReason = reason;
            dismissed = true;
            endedAt = Time.time;
            movement.ControlsLocked = true;
            resources.enabled = false;
            deathAnimation.Play(CrewDeathCause.Dismissed);
        }

        private void Message(string content)
        {
            notice = content;
            noticeUntil = Time.unscaledTime + 4f;
        }

        private void TaskError(string reason)
        {
            calibrationErrors++;
            resources.AdjustHull(-3f);
            Message(reason + " · −3 puntos de casco.");
        }

        private void CompleteTask()
        {
            if (active == null || crew.IsDead || showMap || !AvailableJob(active) || !HasSlot(active))
                return;

            Job done = active;
            active = null;
            hud.CancelDrag();
            movement.ControlsLocked = false;
            if (!done.Done)
                completed++;
            done.Done = true;
            done.LastCompletedDay = day;
            doneToday++;
            stress = Mathf.Clamp01(stress + 0.035f);
            journalJobs.Add((done.Name, done.Impact));
            lastJobNote = done.JournalNote;
            done.Apply();
            if (done == jobs[2])
                resources.SetOxygenLeak(0);
            done.Marker.color = Ink("65F1AE");
            string status = "";
            if (LunarWorkSchedule.CanSleep(doneToday, MandatoryTransmission))
                status = doneToday == DailyLimit ? " · Vuelve a tu cama y pulsa E para dormir." :
                    " · Puedes dormir con E en tu cama o hacer un tercer trabajo.";
            else if (MandatoryTransmission && doneToday == DailyLimit - 1)
                status = " · El último cupo está reservado para el informe.";
            Message(done.Impact + status);
        }

        private void SendResearch()
        {
            packetsSent++;
            sentToday = true;
            LunarCollection.Unlock("Report");
            LunarCollection.Unlock($"Report.{day}");
        }

        private void BeginTransmission() => transmissionEndsAt = Time.unscaledTime + TransmissionDuration;

        private void SaveDay()
        {
            dayCheckpoint = new DayCheckpoint
            {
                Day = day, Packets = packetsSent, Errors = calibrationErrors,
                Stress = stress, Fatigue = fatigue, CampaignTime = Time.time - poweredAt,
                Equipped = crew.HasSpaceSuit, Tank = crew.CurrentOxygenTank,
                Position = crew.Position, Station = resources.CaptureCheckpoint(),
                Hazards = hazards.CaptureState(), Tapes = vhs.CaptureWatched(),
                Jobs = jobs.ConvertAll(job => (job.Done, job.LastCompletedDay)).ToArray()
            };
        }

        private void RestoreDay(DayCheckpoint snapshot)
        {
            started = true;
            cinematic.FinishArrival();
            cinematic.FinishDeparture();
            playerBody.position = snapshot.Position;
            playerBody.transform.position = new Vector3(snapshot.Position.x, snapshot.Position.y, 0f);
            cameraFollow = new Vector3(snapshot.Position.x, snapshot.Position.y, -10f);
            cameraView.transform.position = cameraFollow;
            airlock.RestoreGameplay();
            crew.RestoreSuit(snapshot.Equipped, snapshot.Tank);
            day = snapshot.Day;
            packetsSent = snapshot.Packets;
            calibrationErrors = snapshot.Errors;
            stress = snapshot.Stress;
            fatigue = snapshot.Fatigue;
            crewArt.SetFatigue(fatigue);
            poweredAt = Time.time - snapshot.CampaignTime;
            nextLeakNotice = Time.time + 20f;
            for (int i = 0; i < jobs.Count; i++)
            {
                Job job = jobs[i];
                (job.Done, job.LastCompletedDay) = snapshot.Jobs[i];
                if (job.Done)
                {
                    completed++;
                    if (!job.Repeatable)
                        job.Marker.color = Ink("65F1AE");
                }
            }
            if (MandatoryTransmission)
                jobs[TransmissionTask].Marker.color = Ink("FFD393");
            hazards.RestoreState(snapshot.Hazards);
            vhs.RestoreWatched(snapshot.Tapes);
            resources.RestoreCheckpoint(snapshot.Station);
            shiftTerminal.gameObject.SetActive(true);
            movement.ControlsLocked = false;
            resources.enabled = true;
            dayCheckpoint = snapshot;
            Message($"Día {day} reiniciado. Estás al comienzo de la jornada.");
        }

        private void RetryDay()
        {
            if (dayCheckpoint == null)
                return;
            pendingDayReload = dayCheckpoint;
            SceneManager.LoadScene(gameObject.scene.name);
        }

        private void AskRetry()
        {
            retryPrompt = true;
            movement.ControlsLocked = true;
            hud.CancelDrag();
        }

        private void Restart()
        {
            playOnReload = true;
            SceneManager.LoadScene(gameObject.scene.name);
        }

        private void ReturnToMenu() => SceneManager.LoadScene(gameObject.scene.name);

        private static void QuitGame()
        {
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#else
            Application.Quit();
#endif
        }

        private void OnDestroy()
        {
            InputSystem.onEvent -= LunarControls.TrackActivity;
            hud?.ReleaseTextures();
            art?.ReleaseKitMeshes();
        }

        private void OnGUI()
        {
            if (hud == null)
                return;

            bool exercise = practice ? tutorial.PracticeTask == LunarExercise.Task : active == jobs[LunarExercise.Task];
            hud.Begin(!cinematic.Playing && !Sleeping && (!started || (Finished && !AnimatingDeath) ||
                (!Finished && (retryPrompt || terminalPanel || telescopePanel || televisionOpen || marsTrekOpen ||
                    dismissalPrompt || showMap || (!Transmitting && !exercise && (practice || active != null))))));
            RenderHud();
            hud.DrawControllerCursor();
        }

        private void RenderHud()
        {
            if (cinematic.Playing)
            {
                if (cinematic.Winning)
                    hud.VictoryCinematic(cinematic.VictorySpace, cinematic.VictoryText);
                else if (!cinematic.Abandoning)
                    hud.Cinematic(cinematic.Caption, cinematic.MaraSpeech, !cinematic.Departure, FinishCinematic);
                return;
            }
            if (Sleeping)
            {
                // Enter se procesa en Update para avanzar una sola hoja por pulsación.
                Event current = Event.current;
                if (journalOpen && current.isKey &&
                    (current.keyCode == KeyCode.Return || current.keyCode == KeyCode.KeypadEnter))
                    current.Use();
                if (journalOpen && solarJournalPage)
                    hud.SolarJournal(day, CampaignDays, () => solarJournalPage = false, TurnJournalPage);
                else if (journalOpen)
                    hud.Journal(day, journalJobs, journalEntry, journalOxygen, journalRadiation,
                        journalStress, fatigue, TurnJournalPage);
                else
                    hud.SleepTransition(sleepProgress, sleepProgress >= SleepDawn, day, Finished);
                return;
            }
            if (!started)
            {
                if (junior.Selected >= 0)
                    hud.JuniorLab(junior);
                else if (collectionsOpen)
                    hud.Collection(() => collectionsOpen = false, junior.Open);
                else
                    hud.MainMenu(StartMission, () => collectionsOpen = true, QuitGame);
                return;
            }
            if (day > 0 && !Finished)
                hud.HazardTint(hazards.OxygenDanger, hazards.RadiationDanger);
            bool alertVisible = day > 0 && !Finished &&
                (hazards.OxygenDanger > 0 || hazards.RadiationDanger > 0);
            Action retryButton = day > 0 && !Finished && !Transmitting && !retryPrompt ? AskRetry : null;
            hud.Top(resources.Current, day, CampaignDays, doneToday, DailyLimit, packetsSent, RoomName, crew, airlock,
                alertVisible, retryButton);
            if (started && !Finished)
                hud.Hazards(hazards, stress, day > 0);

            if (Finished)
            {
                if (AnimatingDeath)
                {
                    hud.EndingEffect(deathAnimation.Cause, deathAnimation.Progress);
                    return;
                }
                Action retryDay = !victory && dayCheckpoint != null ? RetryDay : null;
                hud.Results(victory, campaignExpired, dismissed, dismissalReason ?? crew.DeathReason, crew.DeathAdvice,
                    RoomName, Completed, jobs.Count, endedAt - poweredAt, calibrationErrors, retryDay, Restart, ReturnToMenu);
                return;
            }

            if (retryPrompt)
                hud.RetryPrompt(() => retryPrompt = false, RetryDay);
            else if (Transmitting)
            {
                float progress = 1f - (transmissionEndsAt - Time.unscaledTime) / TransmissionDuration;
                hud.Transmission(progress, practice);
            }
            else if (practice)
            {
                int exercise = tutorial.PracticeTask;
                if (exercise == LunarExercise.Task)
                    hud.Exercise(exerciseGame, () => FinishPractice(false), tutorial.Tip);
                else
                {
                    Job sample = jobs[exercise];
                    Action solved = exercise == TransmissionTask ? BeginTransmission : () => FinishPractice(true);
                    hud.Task(sample.Name, sample.Hint, exercise, solved, Message, () => FinishPractice(false), tutorial.Tip);
                }
            }
            else if (instructorPanel && !showMap)
            {
                hud.Instructor(tutorial.Title, LunarControls.Tutorial(tutorial.Speech));
                if (instructorPanel && hud.TryMove(out Vector2 point, talkingToMara: true))
                    movement.MoveTo(cameraView.ScreenToWorldPoint(new Vector3(point.x, point.y, 10f)));
                hud.Controls(null, null, () => showMap = true);
            }
            else if (terminalPanel)
                hud.DayTerminal(day, CampaignDays, doneToday, DailyLimit, MandatoryTransmission,
                    () => terminalPanel = false);
            else if (dismissalPrompt)
                hud.DismissalPrompt(() => dismissalPrompt = false,
                    () =>
                    {
                        LunarCollection.Unlock("End.NoReport");
                        Dismiss("Dormiste sin enviar los datos obligatorios de investigación.");
                    });
            else if (telescopePanel)
                hud.Telescope(day, CloseTelescope);
            else if (televisionOpen)
                hud.Television(vhs, () =>
                {
                    televisionOpen = false;
                    vhs.Stop();
                });
            else if (marsTrekOpen)
                hud.MarsTrek(marsOrder, marsRound, marsMiss, SelectMarsSite, () => marsTrekOpen = false);
            else if (showMap)
            {
                hud.MapLabels(cameraView, map.Centers);
                hud.Map(jobs.ConvertAll(job => (job.Name, job.Place,
                        job == jobs[TransmissionTask] ? $"+{packetsSent} paquetes enviados" : job.Impact, job.Done,
                        AvailableJob(job) && (day == 0 || HasSlot(job)), JobStatus(job))),
                    day, doneToday, DailyLimit, () => showMap = false);
            }
            else if (active != null)
            {
                void CloseTask()
                {
                    active = null;
                    hud.CancelDrag();
                    movement.ControlsLocked = false;
                }

                if (active == jobs[LunarExercise.Task])
                    hud.Exercise(exerciseGame, CloseTask);
                else
                {
                    int task = jobs.IndexOf(active);
                    Action solved = task == TransmissionTask ? BeginTransmission : CompleteTask;
                    hud.Task(active.Name, active.Hint, task, solved, TaskError, CloseTask);
                }
            }
            else
            {
                if (hud.TryMove(out Vector2 point))
                    movement.MoveTo(cameraView.ScreenToWorldPoint(new Vector3(point.x, point.y, 10f)));
                string detail = day > 0 && nearby != null && doneToday >= DailyLimit ? "Cupo diario completo." : null;
                hud.Controls(InteractHint(), detail, () => showMap = true);
            }

            if (Time.unscaledTime < noticeUntil)
                hud.Toast(LunarControls.Tutorial(notice), crew.HasSpaceSuit || crew.CurrentZone == CrewZone.Airlock, alertVisible);
            if (alertVisible)
                hud.HazardAlerts(hazards);
            if (day == 0)
                hud.SkipTutorial(SkipTutorial);
        }
    }
}
