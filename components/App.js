import React, { useState, useEffect, useRef } from 'react'
import {
	StyleSheet,
	Text,
	View,
	TouchableOpacity,
	Animated,
	Easing,
	Dimensions,
	Platform,
	Modal,
	TextInput,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useKeepAwake } from 'expo-keep-awake'
import * as Brightness from 'expo-brightness'
import { AnimatedCircularProgress } from 'react-native-circular-progress'

const { width } = Dimensions.get('window')

export default function App() {
	useKeepAwake()

	const TOTAL_SESSIONS = 8
	const [sessionDuration, setSessionDuration] = useState(25 * 60)
	const [timeLeft, setTimeLeft] = useState(sessionDuration)
	const [isRunning, setIsRunning] = useState(false)
	const [completedSessions, setCompletedSessions] = useState(0)
	const [isTimePickerVisible, setTimePickerVisible] = useState(false)
	const [customTime, setCustomTime] = useState('25')

	const scaleAnim = useRef(new Animated.Value(1)).current
	const rocketAnim = useRef(new Animated.Value(0)).current
	const rocketOpacity = useRef(new Animated.Value(0)).current

	useEffect(() => {
		let timer
		if (isRunning && timeLeft > 0) {
			timer = setInterval(() => setTimeLeft((t) => t - 1), 1000)
		} else if (timeLeft === 0) {
			triggerAnimation()
			setIsRunning(false)
			setCompletedSessions((sessions) => Math.min(sessions + 1, TOTAL_SESSIONS))
			setTimeLeft(sessionDuration)
		}
		return () => clearInterval(timer)
	}, [isRunning, timeLeft, sessionDuration])

	const triggerAnimation = async () => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(scaleAnim, {
					toValue: 1.2,
					duration: 500,
					easing: Easing.ease,
					useNativeDriver: true,
				}),
				Animated.timing(scaleAnim, {
					toValue: 1,
					duration: 500,
					easing: Easing.ease,
					useNativeDriver: true,
				}),
			]),
			{ iterations: 4 }
		).start()

		if (Platform.OS !== 'web') {
			const originalBrightness = await Brightness.getBrightnessAsync()
			for (let i = 0; i < 4; i++) {
				await Brightness.setBrightnessAsync(0.2)
				await new Promise((res) => setTimeout(res, 500))
				await Brightness.setBrightnessAsync(originalBrightness)
				await new Promise((res) => setTimeout(res, 500))
			}
		}
	}

	const launchRocket = () => {
		rocketAnim.setValue(0)
		rocketOpacity.setValue(1)

		Animated.parallel([
			Animated.timing(rocketAnim, {
				toValue: 1,
				duration: 2000,
				easing: Easing.out(Easing.circle),
				useNativeDriver: true,
			}),
			Animated.timing(rocketOpacity, {
				toValue: 0,
				duration: 2000,
				easing: Easing.ease,
				useNativeDriver: true,
			}),
		]).start()
	}

	const rocketX = rocketAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0, width / 2],
	})

	const rocketY = rocketAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0, -300],
	})

	const toggleTimer = () => {
		setIsRunning(!isRunning)
		if (!isRunning) launchRocket()
	}

	const resetSessions = () => {
		setCompletedSessions(0)
		setTimeLeft(sessionDuration)
		setIsRunning(false)
	}

	const endCurrentSession = () => {
		setTimeLeft(0)
	}

	const handleSetCustomTime = () => {
		const minutes = parseInt(customTime)
		if (!isNaN(minutes) && minutes > 0) {
			const newDuration = minutes * 60
			setSessionDuration(newDuration)
			setTimeLeft(newDuration)
			setTimePickerVisible(false)
		}
	}

	const formatTime = (seconds) =>
		`${Math.floor(seconds / 60)
			.toString()
			.padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`

	return (
		<View style={styles.container}>
			<StatusBar style='light' />
			<View style={styles.card}>
				<AnimatedCircularProgress
					size={250}
					width={24}
					fill={(timeLeft / sessionDuration) * 100}
					tintColor='#44403c'
					backgroundColor='#292524'
					rotation={0}
					lineCap='butt'
				>
					{() => (
						<TouchableOpacity
							onPress={() => {
								!isRunning && setTimePickerVisible(true)
							}}
						>
							<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
								<Text style={styles.timer}>{formatTime(timeLeft)}</Text>
							</Animated.View>
						</TouchableOpacity>
					)}
				</AnimatedCircularProgress>
				<TouchableOpacity style={styles.button} onPress={toggleTimer}>
					<Text style={styles.buttonText}>
						{isRunning ? 'Пауза' : 'Старт 🚀'}
					</Text>
				</TouchableOpacity>
			</View>

			<Animated.Text
				style={[
					styles.rocket,
					{
						opacity: rocketOpacity,
						transform: [{ translateX: rocketX }, { translateY: rocketY }],
					},
				]}
			>
				🚀
			</Animated.Text>

			<View style={styles.card}>
				<TouchableOpacity
					style={styles.sessionButton}
					onPress={endCurrentSession}
				>
					<Text style={styles.sessionButtonText}>Завершить текущий сеанс</Text>
				</TouchableOpacity>
				<View style={styles.progressContainer}>
					{Array.from({ length: TOTAL_SESSIONS }).map((_, index) => (
						<View
							key={index}
							style={[
								styles.progressDot,
								index < completedSessions && styles.activeDot,
							]}
						/>
					))}
				</View>
				<TouchableOpacity style={styles.sessionButton} onPress={resetSessions}>
					<Text style={styles.sessionButtonText}>Сбросить сессии</Text>
				</TouchableOpacity>
			</View>

			<Modal
				visible={isTimePickerVisible}
				animationType='slide'
				transparent={true}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContainer}>
						<Text style={styles.modalTitle}>Выберите время</Text>
						<TextInput
							style={styles.modalInput}
							keyboardType='numeric'
							value={customTime}
							onChangeText={setCustomTime}
						/>
						<View style={styles.modalButtons}>
							<TouchableOpacity
								onPress={() => setTimePickerVisible(false)}
								style={styles.modalButton}
							>
								<Text style={styles.modalButtonText}>Отмена</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={handleSetCustomTime}
								style={styles.modalButton}
							>
								<Text style={styles.modalButtonText}>Установить</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000000',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
	},
	card: {
		backgroundColor: '#292524', // stone-800
		borderColor: '#57534e', // stone-600
		borderWidth: 1,
		borderRadius: 40,
		padding: 20,
		alignItems: 'center',
		marginBottom: 20,
		width: '100%',
	},
	timer: {
		fontSize: 48,
		color: '#FFFFFF',
		fontWeight: 'bold',
		textAlign: 'center',
	},
	button: {
		marginTop: 20,
		backgroundColor: '#44403c', // stone-700
		borderColor: '#57534e', // stone-600
		borderWidth: 1,
		paddingHorizontal: 25,
		paddingVertical: 10,
		borderRadius: 20,
	},
	buttonText: {
		color: '#FFFFFF',
		fontSize: 18,
	},
	sessionButton: {
		marginVertical: 10,
		backgroundColor: '#44403c', // stone-700
		borderColor: '#57534e', // stone-600
		borderWidth: 1,
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 10,
		width: '100%',
	},
	sessionButtonText: {
		color: '#FFFFFF',
		fontSize: 16,
		textAlign: 'center',
	},
	rocket: {
		fontSize: 50,
		position: 'absolute',
	},
	progressContainer: {
		flexDirection: 'row',
		marginTop: 10,
		marginBottom: 10,
	},
	progressDot: {
		width: 28,
		height: 10,
		borderRadius: 5,
		backgroundColor: '#57534e', // stone-600
		marginHorizontal: 5,
	},
	activeDot: {
		backgroundColor: '#FFFFFF',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContainer: {
		width: 300,
		backgroundColor: '#292524', // stone-800
		borderRadius: 10,
		padding: 20,
		borderColor: '#57534e', // stone-600
		borderWidth: 1,
	},
	modalTitle: {
		fontSize: 18,
		color: '#FFFFFF',
		marginBottom: 10,
		textAlign: 'center',
	},
	modalInput: {
		height: 40,
		borderColor: '#57534e', // stone-600
		borderWidth: 1,
		borderRadius: 5,
		backgroundColor: '#44403c', // stone-700
		color: '#FFFFFF',
		paddingHorizontal: 10,
		marginBottom: 10,
		marginHorizontal: 5,
	},
	modalButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	modalButton: {
		padding: 10,
		backgroundColor: '#44403c', // stone-700
		borderRadius: 5,
		borderColor: '#57534e', // stone-600
		borderWidth: 1,
		flex: 1,
		margin: 5,
	},
	modalButtonText: {
		color: '#FFFFFF',
		textAlign: 'center',
	},
})
