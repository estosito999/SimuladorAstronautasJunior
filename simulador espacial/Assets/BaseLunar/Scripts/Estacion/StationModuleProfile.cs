using UnityEngine;

namespace BaseLunar
{
    [CreateAssetMenu(menuName = "Base Lunar/Datos de módulo")]
    public sealed class StationModuleProfile : ScriptableObject
    {
        [SerializeField, Range(1, 7)] private int moduleId = 1;
        [SerializeField, Min(0f)] private float powerDemandKw = 0.5f;
        [Tooltip("Generación autónoma del módulo. La generación solar se configura en ResourceManager.")]
        [SerializeField, Min(0f)] private float independentGenerationKw;
        [Tooltip("Unidades por segundo de juego. Valores negativos consumen reservas.")]
        [SerializeField] private ResourceFlow flowPerSecond;
        [SerializeField, Min(0f)] private float failureRatePerMinute = 0.05f;
        [SerializeField, Min(0f)] private float oxygenLostOnBreach = 4f;

        internal void Configure(int id, float demand, ResourceFlow flow)
        {
            moduleId = id;
            powerDemandKw = demand;
            flowPerSecond = flow;
            failureRatePerMinute = 0f;
        }

        public int ModuleId => moduleId;
        public float PowerDemandKw => Mathf.Max(0f, powerDemandKw);
        public float IndependentGenerationKw => Mathf.Max(0f, independentGenerationKw);
        public ResourceFlow FlowPerSecond => flowPerSecond;
        public float FailureRatePerMinute => Mathf.Max(0f, failureRatePerMinute);
        public float OxygenLostOnBreach => Mathf.Max(0f, oxygenLostOnBreach);
    }
}
