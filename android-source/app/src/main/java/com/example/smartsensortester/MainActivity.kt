package com.example.smartsensortester

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.smartsensortester.ui.theme.SmartSensorTesterProTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val viewModel = SensorViewModel(applicationContext)
        
        setContent {
            SmartSensorTesterProTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    SensorDashboard(viewModel)
                }
            }
        }
    }
}

@Composable
fun SensorDashboard(viewModel: SensorViewModel) {
    val accelState by viewModel.accelState.collectAsState()
    val gyroState by viewModel.gyroState.collectAsState()

    Scaffold(
        topBar = {
            SmallTopAppBar(title = { Text("Smart Sensor Tester Pro") })
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                SensorCard("Accelerometer", accelState)
            }
            item {
                SensorCard("Gyroscope", gyroState)
            }
        }
    }
}

@Composable
fun SensorCard(name: String, state: SensorState) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.large
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = name, style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(8.dp))
            if (state.isAvailable) {
                Text("X: ${state.x}")
                Text("Y: ${state.y}")
                Text("Z: ${state.z}")
            } else {
                Text("Sensor not available", color = MaterialTheme.colorScheme.error)
            }
        }
    }
}
