import type { ModuleId, State } from '../../simulation/types';
import { metrics } from '../../simulation/engine';
import { Habitat } from './Habitat';
import { FlightControlStation } from './FlightControlStation';
import { SolarPanels } from './SolarPanels';
import { CommunicationsDish } from './CommunicationsDish';
import { ChargingDock } from './ChargingDock';
import { PowerCables } from './PowerCables';

interface BaseComplexProps {
  state: State;
  selected: ModuleId;
  onSelect: (id: ModuleId) => void;
}

/**
 * Ensamblado integral de los GameObjects de la Base Lunar Selene:
 * - Estación de Control de Vuelo DSN
 * - Cápsula de Residencia y Soporte Vital
 * - Matrices Fotovoltaicas y Limpieza EDS
 * - Antena Parabólica de Telecomunicaciones
 * - Plataforma de Carga del Rover
 * - Red de Distribución de Potencia y Datos
 */
export function BaseComplex({ state, selected, onSelect }: BaseComplexProps) {
  const m = metrics(state);

  return (
    <group name="BaseLunarSelene_Complex">
      <PowerCables state={state} />
      <ChargingDock state={state} />
      <SolarPanels state={state} selected={selected} onSelect={onSelect} />
      <Habitat powered={m.powered} />
      <FlightControlStation state={state} selected={selected} onSelect={onSelect} />
      <CommunicationsDish state={state} selected={selected} onSelect={onSelect} />
    </group>
  );
}
