package com.example.smartsensortester

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class SensorState(
    val x: Float = 0f,
    val y: Float = 0f,
    val z: Float = 0f,
    val value: Float = 0f,
    val isAvailable: Boolean = false
)

class SensorViewModel(context: Context) : ViewModel(), SensorEventListener {
    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    
    private val _accelState = MutableStateFlow(SensorState())
    val accelState: StateFlow<SensorState> = _accelState.asStateFlow()

    private val _gyroState = MutableStateFlow(SensorState())
    val gyroState: StateFlow<SensorState> = _gyroState.asStateFlow()

    private val accel = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    private val gyro = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)

    init {
        accel?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_NORMAL)
            _accelState.value = _accelState.value.copy(isAvailable = true)
        }
        gyro?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_NORMAL)
            _gyroState.value = _gyroState.value.copy(isAvailable = true)
        }
    }

    override fun onSensorChanged(event: SensorEvent?) {
        event?.let {
            when (it.sensor.type) {
                Sensor.TYPE_ACCELEROMETER -> {
                    _accelState.value = _accelState.value.copy(x = it.values[0], y = it.values[1], z = it.values[2])
                }
                Sensor.TYPE_GYROSCOPE -> {
                    _gyroState.value = _gyroState.value.copy(x = it.values[0], y = it.values[1], z = it.values[2])
                }
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    override fun onCleared() {
        super.onCleared()
        sensorManager.unregisterListener(this)
    }
}
