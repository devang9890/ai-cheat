class BehaviorAnalyzer:
    def __init__(self):
        self.total_frames = 0
        self.face_missing = 0
        self.multiple_faces = 0
        self.looking_away = 0

    def update(self, face_count, looking_away):
        self.total_frames += 1

        if face_count == 0:
            self.face_missing += 1
        elif face_count > 1:
            self.multiple_faces += 1

        if looking_away:
            self.looking_away += 1

    def calculate_score(self):
        if self.total_frames == 0:
            return 0.0, "SAFE"

        face_missing_ratio = self.face_missing / self.total_frames
        multiple_faces_ratio = self.multiple_faces / self.total_frames
        looking_away_ratio = self.looking_away / self.total_frames

        score = (
            face_missing_ratio * 0.4 +
            multiple_faces_ratio * 0.4 +
            looking_away_ratio * 0.2
        )

        if score > 0.6:
            status = "HIGH_RISK"
        elif score > 0.3:
            status = "SUSPICIOUS"
        else:
            status = "SAFE"

        return round(score, 2), status
