import cv2
import mediapipe as mp
import numpy as np

class SingleClass:

    def __init__(self, csv_file_path="static/cursor/gesture_train.csv", src="/dev/video0"):

        # 제스처 관련 변수들
        self.gesture = {
            0:'fist', 1:'one', 2:'two', 3:'three', 4:'four', 5:'five',
            6:'six', 7:'rock', 8:'spiderman', 9:'yeah', 10:'ok'}
        self.click_gesture = {0: 'click'}

        self.file = np.genfromtxt(csv_file_path, delimiter=',')
        self.angle = self.file[:,:-1].astype(np.float32)
        self.label = self.file[:, -1].astype(np.float32)
        self.knn = cv2.ml.KNearest_create()
        self.knn.train(self.angle, cv2.ml.ROW_SAMPLE, self.label)

        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils

        self.src = src
        # self.cap = cv2.VideoCapture(self.src)
        
        print("SingleClass constructor...")

    def captureGesture(self):
        
        print("captureGesture...")
        dot = "/"
        
        is_clicked = False

        with self.mp_hands.Hands(max_num_hands=1) as hands:

            cap = cv2.VideoCapture(self.src)
            
            while True:

                # success, frame = self.cap.read()
                success, frame = cap.read()

                if not success:
                    continue

                frame = cv2.flip(frame, 1)
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                result = hands.process(frame)
                frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)

                if result.multi_hand_landmarks is not None:

                    self.joint = np.zeros((21, 3))

                    for res in result.multi_hand_landmarks:

                        self.mp_drawing.draw_landmarks(
                            frame,
                            res,
                            self.mp_hands.HAND_CONNECTIONS)

                    for i, lm in enumerate(res.landmark):
                        self.joint[i] = [lm.x, lm.y, lm.z]

                    # Compute angles between joints
                    v1 = self.joint[[0,1,2,3,0,5,6,7,0,9,10,11,0,13,14,15,0,17,18,19],:] # Parent joint
                    v2 = self.joint[[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],:] # Child joint
                    v = v2 - v1 # [20,3]

                    # Normalize v
                    v = v / np.linalg.norm(v, axis=1)[:, np.newaxis]

                    # Get angle using arcos of dot product
                    angle = np.arccos(np.einsum('nt,nt->n',
                        v[[0,1,2,4,5,6,8,9,10,12,13,14,16,17,18],:], 
                        v[[1,2,3,5,6,7,9,10,11,13,14,15,17,18,19],:])) # [15,]

                    angle = np.degrees(angle) # Convert radian to degree

                    # Inference gesture
                    data = np.array([angle], dtype=np.float32)
                    ret, results, neighbours, dist = self.knn.findNearest(data, 3)
                    idx = int(results[0][0])

                    # Draw gesture result
                    if idx in self.click_gesture.keys():

                        if is_clicked == False:

                            is_clicked = True
                            print("\rgesture detected!")
                            break
                    
                else:
                    is_clicked = False
                    
                # cv2.imshow('webcam stream', frame)
                
                print(f"gesture NOT detected...{dot}", end='\r')
                
                if dot == "/":
                    dot = "-"
                elif dot == "-":
                    dot = "\\"
                elif dot == "\\":
                    dot = "|"
                elif dot == "|":
                    dot = "/"

                if cv2.waitKey(1) == 27:
                    break
            
            cv2.destroyAllWindows()
            return {'gesture': 'ok'}
