import '@mantine/core/styles.css'
import { Alert, Button, Checkbox, Code, Flex, List, Loader, MantineProvider, ScrollArea, TextInput, Title, createTheme } from '@mantine/core'
import { useForm } from '@mantine/form'
import { IconAccessPoint, IconAccessPointOff, IconCircleDot, IconInfoCircle } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { CustomLoader } from './components/Loader/CustomLoader'
import { zodResolver } from 'mantine-form-zod-resolver'
import { z } from 'zod'
import { Command } from '@tauri-apps/api/shell'
import { usePersistedStore, useStore } from './store'
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification'
import { invoke } from '@tauri-apps/api'

const theme = createTheme({
  components: {
    Loader: Loader.extend({
      defaultProps: {
        loaders: { ...Loader.defaultLoaders, custom: CustomLoader },
        type: 'custom',
      },
    }),
  },
})
enum ConnectionStatus { "IDDLE", 'SUCCESS', "FAIL", "TESTING" }

const schema = z.object({
  monitor: z.string().ip({ version: 'v4', message: 'Endereço de IP inválido' }).optional().or(z.literal('')),
  radioOne: z.string().ip({ version: 'v4', message: 'Endereço de IP inválido' }).optional().or(z.literal('')),
  radioTwo: z.string().ip({ version: 'v4', message: 'Endereço de IP inválido' }).optional().or(z.literal('')),
  radioThree: z.string().ip({ version: 'v4', message: 'Endereço de IP inválido' }).optional().or(z.literal(''))
});


function App() {
  const { ips, setIps, directConnection, setDirectConnection } = usePersistedStore()
  const { setConnectionsStatus, connectionsStatus } = useStore()
  const [log, setLog] = useState<String[]>([])
  const [isChanged, setIsChanged] = useState(false)
  const [timeoutRef, setTimeoutRef] = useState<number[]>([])
  const form = useForm({
    initialValues: {
      monitor: ips.monitor,
      radioOne: ips.radioOne,
      radioTwo: ips.radioTwo,
      radioThree: ips.radioThree
    },
    validate: zodResolver(schema)
  })


  const getStatusIcon = (status: ConnectionStatus) => {
    if (status === ConnectionStatus.FAIL) return <IconAccessPointOff color='#F06418' />
    if (status === ConnectionStatus.SUCCESS) return <IconAccessPoint color='#2BDD66' />
    if (status === ConnectionStatus.TESTING) return <Loader size={14} />

    return <IconCircleDot size={13} />
  }

  const stopInterval = () => {
    for (var i = 0; i < timeoutRef.length; i++) {
      clearTimeout(timeoutRef[i]);
    }
    setTimeoutRef([])
  }

  const startInterval = (time: number) => {
    if (timeoutRef.length > 0) stopInterval()
    const timeRef = setTimeout(() => testConnectivity(ips), time)
    setTimeoutRef(old => [...old, timeRef])
  }

  const testConnectivity = async (values: typeof ips) => {
    stopInterval()

    setLog(log => [...log, `${new Date().toLocaleString()} Starting connectivity check \n`])

    Object.keys(values).forEach(async (data) => {
      const device = data as unknown as keyof typeof values
      const deviceIp = values[device] as string

      // skip if directConn is setted and device is a radio
      if (directConnection && device !== 'monitor') {
        setLog(log => [...log, `${new Date().toLocaleString()} Skipped ${device} due direct connection \n`])
        return
      }

      // skip if ip is a blank string
      if (!deviceIp || deviceIp.length === 0) {
        setConnectionsStatus({ [device]: ConnectionStatus.IDDLE })
        return
      }

      // starting connection test
      const oldConnectionStatus = connectionsStatus[device]

      setConnectionsStatus({ [device]: ConnectionStatus.TESTING })

      const command = new Command('ping', [deviceIp, '-n', '1'], { encoding: 'utf-8' })
      await command.spawn()

      command.stdout.on('data', async (data: string) => {
        setLog(log => [...log, `${device}: ${data}`])

        // success ping case
        if (data.includes(deviceIp) && data.includes('tempo')) {
          // send notification if monitor conn is change from fail to success
          if (device === 'monitor') startInterval(5 * 60000)
          if (oldConnectionStatus != ConnectionStatus.SUCCESS && device === 'monitor') {
            invoke('set_success_tray')
            sendNotification(`Monitor SCM Sarclad está conectado a rede.`)
          }
          setConnectionsStatus({ [device]: ConnectionStatus.SUCCESS })
        }

        // fail ping case
        if (data.includes('inac') || data.includes('Esgotado') || data.includes('limite')) {
          // send notification if monitor conn is change from success to fail
          if (device === 'monitor') startInterval(10000)
          if (oldConnectionStatus != ConnectionStatus.FAIL && device === 'monitor') {
            sendNotification(`Monitor SCM Sarclad não está conectado na rede.`)
            invoke('set_fail_tray')
          }
          setConnectionsStatus({ [device]: ConnectionStatus.FAIL })
        }
      })

      command.on('error', data => {
        setLog(log => [...log, `${device}: ${data}`])
        setConnectionsStatus({ [device]: ConnectionStatus.FAIL })
      })
    })
  }

  const onSetDirectConnection = () => {
    if (directConnection) {
      setConnectionsStatus({
        radioOne: ConnectionStatus.IDDLE,
        radioTwo: ConnectionStatus.IDDLE,
        radioThree: ConnectionStatus.IDDLE
      })
    }
    setDirectConnection(!directConnection)
  }

  const handleFormChange = (field: keyof typeof form.values) => {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setIsChanged(true)
      stopInterval()


      form.setFieldValue(field, event.target.value)
      setConnectionsStatus({ [field]: ConnectionStatus.IDDLE })
    }
  }

  const handleReset = () => {
    form.setValues({
      monitor: ips.monitor,
      radioOne: ips.radioOne,
      radioTwo: ips.radioTwo,
      radioThree: ips.radioThree
    })
    setIsChanged(false)
    testConnectivity(form.values)
  }

  const handleSave = async () => {
    if (form.validate().hasErrors) {
      setLog(log => [...log, `Test stoped due validation errors \n`])
      return
    }
    setIps(form.values)
    setIsChanged(false)

    await testConnectivity(form.values)
  }

  useEffect(() => {
    (async () => {
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }

      startInterval(1000)
    })()

    return () => {
      stopInterval()
    }
  }, [])

  return (
    <MantineProvider theme={theme}>
      <Flex
        p={10}
        pt={30}
        direction='column'
      >
        <Title size={20} > SCM Ping Tool </Title>
        <Alert variant="light" color="blue" title="Nota" icon={<IconInfoCircle />} mt={20}>
          Este aplicativo permite testar a conectividade entre o computador e o monitor SCM Sarclad.
          <br />
          <br />
          Aguarde 5 minutos após ligar o monitor, caso o problema de conectividade persista verifique:
          <List withPadding mt={5}>
            <List.Item>O computador está conectado na rede wifi?</List.Item>
            <List.Item>O monitor está em um local aberto ou totalmente inserido no veio?</List.Item>
          </List>
        </Alert>
        <Flex
          justify={'space-evenly'}
          direction={'row'}
          wrap={'wrap'}
        >
          <Flex
            direction={'column'}
            pt={30}
          >
            <Title size={13}>Monitor</Title>
            <TextInput
              mt={15}
              description="Insira o IP do monitor SCM Sarclad "
              {...form.getInputProps('monitor')}
              rightSection={getStatusIcon(connectionsStatus.monitor)}
              onChange={handleFormChange('monitor')}
            />
          </Flex>
          <Flex direction={'column'}
            pt={30}
          >

            <Title size={13}>Radios WiFi</Title>
            <TextInput

              disabled={directConnection}
              mt={15}
              description="Insira o IP do radio 1"
              rightSection={getStatusIcon(connectionsStatus.radioOne)}
              {...form.getInputProps('radioOne')}
              onChange={handleFormChange('radioOne')}
            />
            <TextInput
              disabled={directConnection}
              mt={15}
              description="Insira o IP do radio 2"
              {...form.getInputProps('radioTwo')}
              rightSection={getStatusIcon(connectionsStatus.radioTwo)}
              onChange={handleFormChange('radioTwo')}
            />

            <TextInput
              disabled={directConnection}
              mt={15}
              description="Insira o IP do radio 3"
              {...form.getInputProps('radioThree')}
              rightSection={getStatusIcon(connectionsStatus.radioThree)}
            />

            <Checkbox
              mt={20}
              label={"Conexão direta ?"}
              checked={directConnection}
              onChange={onSetDirectConnection}

            />

          </Flex>

        </Flex>

        <Flex
          justify={'center'}
          align={'center'}
          wrap={'wrap'}
          mt={40}
          gap={20}
        >

          <Button
            onClick={handleSave}
            w={200}
            disabled={!isChanged}
          >
            Salvar
          </Button>

          <Button
            onClick={handleReset}
            w={80}
            variant='outline'
          >
            Reset
          </Button>
        </Flex>

      </Flex>
      <Flex direction={'column'} p={10}>
        <Flex align={'center'} >
          <Title size={15} mr={10}>
            Log
          </Title>
          {timeoutRef.length > 0 ? <Loader color="blue" type="bars" size={8} /> : null}
        </Flex>

        <ScrollArea mt={10} h={200}>
          <Code block>
            {JSON.stringify(connectionsStatus)}
            <br />
            {JSON.stringify(ips)}
            <br />
            {log}
          </Code>
        </ScrollArea>
      </Flex>

    </MantineProvider>
  );
}

export default App
