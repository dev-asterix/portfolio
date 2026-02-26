import si from "systeminformation";

export interface SystemProcess {
  pid: number;
  name: string;
  cpu: number; // percent
  mem: number; // MB (best-effort)
}

export interface SystemInfo {
  osName: string;
  cpuModel: string;
  memTotal: number;
  memUsed: number;
  diskTotal: number;
  diskUsed: number;
  cpuLoad?: number; // overall CPU %
  processes?: SystemProcess[];
}

export async function getSystemInfo(): Promise<SystemInfo> {
  try {
    // gather core info and process/cpu metrics
    const [os, cpu, mem, fsSize, load, procInfo] = await Promise.all([
      si.osInfo(),
      si.cpu(),
      si.mem(),
      si.fsSize(),
      si.currentLoad(),
      si.processes(),
    ]);

    // Calculate total disk size and used space from all mounted drives
    let diskTotal = 0;
    let diskUsed = 0;
    fsSize.forEach((disk) => {
      diskTotal += disk.size || 0;
      diskUsed += disk.used || 0;
    });

    // Map processes to a lighter-weight array
    const processes: SystemProcess[] = (procInfo?.list || []).map((p: any) => {
      // Attempt to derive mem in bytes or percent; convert to MB best-effort
      const memVal = p.mem || p.memVsz || 0;
      const memMB = Math.round((memVal || 0) / (1024 * 1024));
      return {
        pid: p.pid,
        name: p.name,
        cpu: Number((p.cpu || 0).toFixed(2)),
        mem: memMB,
      };
    });

    return {
      osName: `${os.distro} ${os.release}`,
      cpuModel: cpu.brand,
      memTotal: mem.total,
      memUsed: mem.active,
      diskTotal,
      diskUsed,
      cpuLoad: load?.currentLoad ?? undefined,
      processes,
    };
  } catch (err) {
    console.error("Error fetching system info:", err);
    return {
      osName: "Unknown OS",
      cpuModel: "Unknown CPU",
      memTotal: 0,
      memUsed: 0,
      diskTotal: 0,
      diskUsed: 0,
    };
  }
}
