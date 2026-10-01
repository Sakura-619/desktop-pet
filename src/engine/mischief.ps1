param(
    [string]$Action = "status",
    [int]$DeltaX = 50,
    [int]$DeltaY = 0
)

$def = @'
using System;
using System.Runtime.InteropServices;

public class Win32Helper {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    [DllImport("user32.dll", SetLastError=true)]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }
}
'@

try {
    if (-not ([System.Management.Automation.PSTypeName]'Win32Helper').Type) {
        Add-Type -TypeDefinition $def
    }

    $hwnd = [Win32Helper]::GetForegroundWindow()
    if ($hwnd -eq [IntPtr]::Zero) {
        Write-Output '{"status":"no_window"}'
        exit 0
    }

    $pidVal = 0
    [Win32Helper]::GetWindowThreadProcessId($hwnd, [ref]$pidVal) | Out-Null
    $proc = Get-Process -Id $pidVal -ErrorAction SilentlyContinue

    # Skip if foreground window is electron or our app
    if ($proc -and ($proc.ProcessName -like "*electron*" -or $proc.ProcessName -like "*desktop-pet*")) {
        Write-Output '{"status":"skipped_self"}'
        exit 0
    }

    if ($Action -eq "minimize") {
        # SW_MINIMIZE = 6
        [Win32Helper]::ShowWindow($hwnd, 6) | Out-Null
        Write-Output '{"status":"minimized"}'
    }
    elseif ($Action -eq "drag") {
        $rect = New-Object Win32Helper+RECT
        if ([Win32Helper]::GetWindowRect($hwnd, [ref]$rect)) {
            $width = $rect.Right - $rect.Left
            $height = $rect.Bottom - $rect.Top
            $newX = $rect.Left + $DeltaX
            $newY = $rect.Top + $DeltaY

            # 0x0040 = SWP_SHOWWINDOW, 0x0004 = SWP_NOZORDER
            [Win32Helper]::SetWindowPos($hwnd, [IntPtr]::Zero, $newX, $newY, $width, $height, 0x0044) | Out-Null
            Write-Output '{"status":"dragged","newX":'$newX',"newY":'$newY'}'
        } else {
            Write-Output '{"status":"rect_failed"}'
        }
    }
    else {
        Write-Output '{"status":"ready"}'
    }
}
catch {
    Write-Output "{\"status\":\"error\",\"message\":$($_.Exception.Message | ConvertTo-Json)}"
}
