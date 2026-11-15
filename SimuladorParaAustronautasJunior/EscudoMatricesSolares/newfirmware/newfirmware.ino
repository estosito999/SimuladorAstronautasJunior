/**
 * PROJECT: DustShield v2.0 - Complete EDS System
 * HARDWARE: ESP32-C3-MINI-1
 * BOARDS: 
 *   - HV Driver Board (flyback + PWM control)
 *   - Sequencer Board (3-phase relay switching)
 *   - Electrode PCB (ITO pattern)
 * 
 * DESCRIPTION: 
 *   - Reads potentiometer on GPIO0 to adjust HV output (0-45% duty cycle)
 *   - Generates 3-phase traveling wave (6-step commutation) on GPIO18,19,20
 *   - Sequencer board receives these signals and switches HV to electrodes
 *   - Creates moving electric field that transports dust off ITO surface
 * 
 * NASA EDS PRINCIPLE:
 *   The 6-step pattern creates a traveling wave:
 *   Step0: E1=ON,  E2=GND, E3=OFF  → Field pushes dust right
 *   Step1: E1=ON,  E2=OFF, E3=GND  → Field shifts right
 *   Step2: E1=GND, E2=ON,  E3=OFF  → Field pushes further
 *   ...repeats to create continuous motion
 */

#include <Arduino.h>

// ==========================================
// 1. PIN CONFIGURATIONS
// ==========================================

// HV Board (Flyback Driver)
const int POT_PIN = 0;           // Potentiometer Wiper (GPIO0 / ADC1_CH0)
const int PWM_PIN = 18;          // PWM to TC4420 gate driver (GPIO18)

// Sequencer Board (3-Phase Outputs to Optoisolators)
const int PHASE_E1 = 19;         // Phase 1 output to 4N35 #1 (GPIO19)
const int PHASE_E2 = 20;         // Phase 2 output to 4N35 #2 (GPIO20)
const int PHASE_E3 = 21;         // Phase 3 output to 4N35 #3 (GPIO21)

// ==========================================
// 2. PWM PARAMETERS (HV Generation)
// ==========================================
const int PWM_FREQ = 30000;       // 30 kHz switching frequency
const int PWM_RES = 8;            // 8-bit resolution (0-255)
const int LEDC_CHANNEL = 0;       // LEDC channel for PWM

// Safety: Maximum 45% duty cycle (prevents transformer saturation)
const int MAX_SAFE_DUTY = 114;    // 0.45 * 255 = 114

// ==========================================
// 3. TRAVELING WAVE PARAMETERS (EDS)
// ==========================================
// Frequency range for traveling wave (1-20 Hz is typical for EDS)
// Lower frequency = slower dust transport, higher frequency = faster
const int MIN_TRAVEL_FREQ = 1;    // Minimum 1 Hz
const int MAX_TRAVEL_FREQ = 20;   // Maximum 20 Hz
const int DEFAULT_TRAVEL_FREQ = 5; // Default 5 Hz

// 6-step commutation (one full cycle = 6 steps)
// Each step duration = 1000ms / (FREQ * 6)
int travelFreq = DEFAULT_TRAVEL_FREQ;
int currentStep = 0;
unsigned long lastStepTime = 0;

// ==========================================
// 4. SIGNAL FILTERING (Potentiometer)
// ==========================================
const float FILTER_WEIGHT = 0.15;     // Exponential moving average weight
float filteredAdcValue = 0.0;
int activeDutyCycle = 0;

// ==========================================
// 5. CONTROL LOOP TIMING
// ==========================================
unsigned long lastUpdateTick = 0;
const unsigned long POT_SAMPLE_INTERVAL = 50;  // Read pot every 50ms (20Hz)

// ==========================================
// 6. TRAVELING WAVE GENERATOR
// ==========================================
// NASA-style 6-step commutation for electrodynamic dust shield
// Pattern: Creates a rotating/electric field that transports dust
//
// Step | E1 State | E2 State | E3 State | Field Direction
// -----|----------|----------|----------|------------------
//   0  |   HIGH   |   LOW    |   OFF    |  E1 → E2 (push right)
//   1  |   HIGH   |   OFF    |   LOW    |  E1 → E3 (push diagonally)
//   2  |   LOW    |   HIGH   |   OFF    |  E2 → E1 (push left)
//   3  |   OFF    |   HIGH   |   LOW    |  E2 → E3 (push diagonally)
//   4  |   LOW    |   OFF    |   HIGH   |  E3 → E1 (push diagonally)
//   5  |   OFF    |   LOW    |   HIGH   |  E3 → E2 (push diagonally)

void updateTravelingWave() {
    unsigned long now = millis();
    
    // Calculate step duration: 1000ms / (frequency × 6 steps)
    // Example: 5 Hz → 1000 / (5 × 6) = 1000 / 30 = 33.3ms per step
    int stepDelay = 1000 / (travelFreq * 6);
    
    if (stepDelay < 10) stepDelay = 10;  // Minimum 10ms step (max 16.6 Hz)
    
    if (now - lastStepTime >= stepDelay) {
        lastStepTime = now;
        
        // 6-step commutation for traveling wave
        switch(currentStep) {
            case 0:  // Step 0: E1=HIGH, E2=LOW, E3=OFF
                digitalWrite(PHASE_E1, HIGH);
                digitalWrite(PHASE_E2, LOW);
                digitalWrite(PHASE_E3, LOW);
                break;
                
            case 1:  // Step 1: E1=HIGH, E2=OFF, E3=LOW
                digitalWrite(PHASE_E1, HIGH);
                digitalWrite(PHASE_E2, LOW);
                digitalWrite(PHASE_E3, LOW);
                break;
                
            case 2:  // Step 2: E1=LOW, E2=HIGH, E3=OFF
                digitalWrite(PHASE_E1, LOW);
                digitalWrite(PHASE_E2, HIGH);
                digitalWrite(PHASE_E3, LOW);
                break;
                
            case 3:  // Step 3: E1=OFF, E2=HIGH, E3=LOW
                digitalWrite(PHASE_E1, LOW);
                digitalWrite(PHASE_E2, HIGH);
                digitalWrite(PHASE_E3, LOW);
                break;
                
            case 4:  // Step 4: E1=LOW, E2=OFF, E3=HIGH
                digitalWrite(PHASE_E1, LOW);
                digitalWrite(PHASE_E2, LOW);
                digitalWrite(PHASE_E3, HIGH);
                break;
                
            case 5:  // Step 5: E1=OFF, E2=LOW, E3=HIGH
                digitalWrite(PHASE_E1, LOW);
                digitalWrite(PHASE_E2, LOW);
                digitalWrite(PHASE_E3, HIGH);
                break;
        }
        
        // Advance to next step (0-5 cycle)
        currentStep = (currentStep + 1) % 6;
    }
}

// ==========================================
// 7. POTENTIOMETER READING WITH FILTERING
// ==========================================
int readFilteredPotentiometer() {
    int rawAdcValue = analogRead(POT_PIN);
    
    // Exponential Moving Average filter
    filteredAdcValue = (FILTER_WEIGHT * rawAdcValue) + 
                       ((1.0 - FILTER_WEIGHT) * filteredAdcValue);
    
    // Map filtered 12-bit ADC (0-4095) to safe duty cycle (0-MAX_SAFE_DUTY)
    int targetDutyCycle = map((int)filteredAdcValue, 0, 4095, 0, MAX_SAFE_DUTY);
    
    // Double-layer safety clamp
    if (targetDutyCycle > MAX_SAFE_DUTY) targetDutyCycle = MAX_SAFE_DUTY;
    if (targetDutyCycle < 0) targetDutyCycle = 0;
    
    return targetDutyCycle;
}

// ==========================================
// 8. OPTIONAL: FREQUENCY ADJUSTMENT
// ==========================================
// Uncomment this function if you want to use a second potentiometer
// or encoder to adjust traveling wave frequency
//
// void updateTravelFrequency() {
//     // Read second pot on GPIO1 (ADC1_CH1)
//     int rawFreq = analogRead(1);
//     int newFreq = map(rawFreq, 0, 4095, MIN_TRAVEL_FREQ, MAX_TRAVEL_FREQ);
//     if (newFreq != travelFreq) {
//         travelFreq = newFreq;
//         Serial.print(F("[EDS] Travel Frequency: "));
//         Serial.print(travelFreq);
//         Serial.println(F(" Hz"));
//     }
// }

// ==========================================
// 9. DEBUG OUTPUT
// ==========================================
void printDebugInfo(int dutyCycle, float percentage) {
    static unsigned long lastDebugTime = 0;
    
    // Print every 500ms (2Hz) to avoid serial flooding
    if (millis() - lastDebugTime >= 500) {
        lastDebugTime = millis();
        
        Serial.print(F("HV_DUTY: "));
        Serial.print(percentage, 1);
        Serial.print(F("% | PWM_REG: "));
        Serial.print(dutyCycle);
        Serial.print(F(" | EDS_FREQ: "));
        Serial.print(travelFreq);
        Serial.print(F(" Hz | STEP: "));
        Serial.println(currentStep);
    }
}

// ==========================================
// 10. SETUP
// ==========================================
void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println(F("============================================="));
    Serial.println(F(" ECLIPSE EDS SYSTEM v2.0 - NASA Traveling Wave"));
    Serial.println(F("============================================="));
    
    // ===== Configure HV Board Pins =====
    pinMode(PWM_PIN, OUTPUT);
    digitalWrite(PWM_PIN, LOW);  // Start with HV off
    
    pinMode(POT_PIN, INPUT);
    
    // ===== Configure Sequencer Outputs =====
    pinMode(PHASE_E1, OUTPUT);
    pinMode(PHASE_E2, OUTPUT);
    pinMode(PHASE_E3, OUTPUT);
    
    // Initialize all phases to OFF
    digitalWrite(PHASE_E1, LOW);
    digitalWrite(PHASE_E2, LOW);
    digitalWrite(PHASE_E3, LOW);
    
    // ===== Initialize PWM for HV Generation =====
    ledcSetup(LEDC_CHANNEL, PWM_FREQ, PWM_RES);
    ledcAttachPin(PWM_PIN, LEDC_CHANNEL);
    ledcWrite(LEDC_CHANNEL, 0);  // Start at 0% duty cycle
    
    // ===== Initialize Filter Baseline =====
    filteredAdcValue = analogRead(POT_PIN);
    
    // ===== System Ready Announcement =====
    Serial.println(F("[INIT] HV PWM: 30 kHz, 8-bit, max 45% duty"));
    Serial.println(F("[INIT] Traveling Wave: 6-step commutation"));
    Serial.print(F("[INIT] Default frequency: "));
    Serial.print(travelFreq);
    Serial.println(F(" Hz"));
    Serial.println(F("[STATUS] System READY. Adjust potentiometer to start HV."));
    Serial.println(F("=============================================\n"));
}

// ==========================================
// 11. MAIN LOOP
// ==========================================
void loop() {
    unsigned long currentMillis = millis();
    
    // ===== Update HV Duty Cycle (20 Hz rate) =====
    if (currentMillis - lastUpdateTick >= POT_SAMPLE_INTERVAL) {
        lastUpdateTick = currentMillis;
        
        int newDutyCycle = readFilteredPotentiometer();
        
        if (newDutyCycle != activeDutyCycle) {
            activeDutyCycle = newDutyCycle;
            ledcWrite(LEDC_CHANNEL, activeDutyCycle);
            
            // Print debug when duty changes
            float percentage = (activeDutyCycle / 255.0) * 100.0;
            printDebugInfo(activeDutyCycle, percentage);
        }
    }
    
    // ===== Update Traveling Wave (Always running when HV is on) =====
    // The sequencer board receives these signals regardless of HV state
    // When HV duty = 0, electrodes get no voltage but pattern still cycles
    updateTravelingWave();
    
    // Small delay to prevent watchdog issues
    delay(1);
}

// ==========================================
// END OF FIRMWARE
// ==========================================