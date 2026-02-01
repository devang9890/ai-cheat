class BehaviorAnalyzer:
    def __init__(self):
        self.total_frames = 0
        self.face_missing = 0
        self.multiple_faces = 0
        self.looking_away = 0
        self.tab_switches = 0
        self.last_tab_switches = 0
        self.tab_switch_events = 0
        self.recent_tab_switch = False

    def update(self, face_count, looking_away, tab_switches=0):
        self.total_frames += 1

        if face_count == 0:
            self.face_missing += 1
        elif face_count > 1:
            self.multiple_faces += 1

        if looking_away:
            self.looking_away += 1

        # Track latest cumulative tab switch count from client
        # and compute delta events for responsiveness
        delta = max(0, tab_switches - self.last_tab_switches)
        self.last_tab_switches = tab_switches
        self.tab_switches = tab_switches
        self.tab_switch_events += delta
        self.recent_tab_switch = delta > 0

    def calculate_score(self):
        if self.total_frames == 0:
            return 0.0, "SAFE"

        face_missing_ratio = self.face_missing / self.total_frames
        multiple_faces_ratio = self.multiple_faces / self.total_frames
        looking_away_ratio = self.looking_away / self.total_frames

        tab_switch_ratio = 0.0 if self.total_frames == 0 else min(self.tab_switch_events / self.total_frames, 1.0)

        # Increase sensitivity and add a small boost on the frame
        # where a tab switch occurred to reflect recent behavior.
        score = (
            face_missing_ratio * 0.30 +
            multiple_faces_ratio * 0.30 +
            looking_away_ratio * 0.20 +
            tab_switch_ratio * 0.20
        )

        if self.recent_tab_switch:
            score += 0.15

        # Immediate high risk if 3+ tab switches overall
        if self.tab_switches >= 3:
            status = "HIGH_RISK"
        elif score > 0.5:
            status = "HIGH_RISK"
        elif score > 0.25:
            status = "SUSPICIOUS"
        else:
            status = "SAFE"

        return round(score, 2), status
